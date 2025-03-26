
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { getAllBuilders } from '@/utils/faceRecognition';
// Import markAttendance directly from attendance utils to avoid ambiguity
import { markAttendance } from '@/utils/attendance/markAttendance';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardData = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const subscribedRef = useRef(false);
  
  // Get today's date in a localized format
  const today = useMemo(() => new Date(), []);
  const selectedDate = useMemo(() => today.toLocaleDateString(), [today]);

  // Memoize the loadBuilders function with useCallback
  const loadBuilders = useCallback(async () => {
    console.log('Loading builders data...');
    setIsLoading(true);
    try {
      const data = await getAllBuilders();
      console.log('Loaded builders:', data.length);
      setBuilders(data);
      
      // Apply existing filters to the new data
      let filtered = [...data];
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(builder => 
          builder.name.toLowerCase().includes(query) || 
          (builder.builderId && builder.builderId.toLowerCase().includes(query))
        );
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(builder => builder.status === statusFilter);
      }
      
      setFilteredBuilders(filtered);
    } catch (error) {
      console.error('Error loading builders:', error);
      toast.error('Failed to load builder data');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  // Set up subscriptions only once
  useEffect(() => {
    if (subscribedRef.current) return;
    
    console.log('Setting up Supabase subscriptions');
    subscribedRef.current = true;
    
    // Subscribe to attendance changes
    const attendanceChannel = supabase
      .channel('dashboard-attendance-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance' }, 
        (payload) => {
          console.log('Attendance change detected:', payload.eventType);
          loadBuilders();
        }
      )
      .subscribe();
      
    // Subscribe to student profile changes
    const profileChannel = supabase
      .channel('dashboard-profile-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'students' }, 
        (payload) => {
          console.log('Student profile change detected:', payload.eventType);
          loadBuilders();
        }
      )
      .subscribe();
    
    // Initial load
    loadBuilders();
    
    return () => {
      console.log('Cleaning up Supabase subscriptions');
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(profileChannel);
      subscribedRef.current = false;
    };
  }, [loadBuilders]);

  // Apply filters when search or status filter changes
  useEffect(() => {
    if (!builders.length) return;
    
    let results = [...builders];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(builder => 
        builder.name.toLowerCase().includes(query) || 
        (builder.builderId && builder.builderId.toLowerCase().includes(query))
      );
    }
    
    if (statusFilter !== 'all') {
      results = results.filter(builder => builder.status === statusFilter);
    }
    
    setFilteredBuilders(results);
  }, [builders, searchQuery, statusFilter]);

  const handleMarkAttendance = useCallback(async (builderId: string, status: BuilderStatus, excuseReason?: string) => {
    try {
      // Pass only the required parameters to markAttendance
      const success = await markAttendance(builderId, status, excuseReason);
      
      if (success) {
        // Update will happen via the subscription, but update local state immediately for responsiveness
        setBuilders(prevBuilders => 
          prevBuilders.map(builder => 
            builder.id === builderId
              ? { 
                  ...builder, 
                  status,
                  excuseReason: status === 'excused' ? excuseReason : undefined,
                  timeRecorded: new Date().toLocaleTimeString() 
                }
              : builder
          )
        );
        
        const statusText = status === 'excused' ? 'Excused absence' : `Attendance marked as ${status}`;
        toast.success(statusText);
      } else {
        toast.error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('An error occurred while updating attendance');
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  return {
    builders,
    filteredBuilders,
    isLoading,
    searchQuery,
    statusFilter,
    selectedDate,
    setSearchQuery,
    setStatusFilter,
    handleMarkAttendance,
    handleClearFilters,
    loadBuilders
  };
};
