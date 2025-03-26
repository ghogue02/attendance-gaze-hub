
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  
  // Get today's date in a localized format
  const today = useMemo(() => new Date(), []);
  const selectedDate = useMemo(() => today.toLocaleDateString(), [today]);

  // Memoize the loadBuilders function with useCallback
  const loadBuilders = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading builders with today\'s date:', today.toISOString().split('T')[0]);
      const data = await getAllBuilders();
      console.log('Loaded builders:', data.length);
      setBuilders(data);
      setFilteredBuilders(data);
    } catch (error) {
      console.error('Error loading builders:', error);
      toast.error('Failed to load builder data');
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadBuilders();
    
    // Subscribe to attendance changes with improved handling
    const attendanceChannel = supabase
      .channel('dashboard-attendance-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance' }, 
        () => {
          console.log('Attendance change detected, refreshing data');
          loadBuilders();
        }
      )
      .subscribe();
      
    // Subscribe to student profile changes with improved handling
    const profileChannel = supabase
      .channel('dashboard-profile-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'students' }, 
        () => {
          console.log('Student profile change detected, refreshing data');
          loadBuilders();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [loadBuilders]);

  useEffect(() => {
    // Apply filters when builders, search query, or status filter changes
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
        // Update local state immediately for a more responsive UI
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
