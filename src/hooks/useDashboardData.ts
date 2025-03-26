
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { getAllBuilders } from '@/utils/faceRecognition';
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
  const selectedDate = useMemo(() => new Date().toLocaleDateString(), []);

  // Stable function to load/refresh data - no dependencies for stability
  const loadData = useCallback(async (showLoading = true) => {
    console.log('Executing loadData...');
    if (showLoading) setIsLoading(true);
    try {
      const data = await getAllBuilders();
      console.log('loadData fetched builders:', data.length, 'Present:', data.filter(b => b.status === 'present').length);
      setBuilders(data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load builder data');
      setBuilders([]); // Clear data on error
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []); // Empty dependency array ensures this function is stable

  // Effect for initial load and subscriptions - only depends on stable loadData
  useEffect(() => {
    if (subscribedRef.current) return;
    
    console.log('Setting up Supabase subscriptions and initial load');
    subscribedRef.current = true;
    
    // Initial load
    loadData();
    
    // Setup subscriptions
    const handleDbChange = (payload: any, source: string) => {
      console.log(`${source} change detected:`, payload.eventType, payload.new?.id || payload.old?.id);
      // Reload data without showing the main loading indicator for smoother updates
      loadData(false);
    };
    
    const attendanceChannel = supabase
      .channel('dashboard-attendance-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance' }, 
        (payload) => handleDbChange(payload, 'Attendance')
      )
      .subscribe();
      
    const profileChannel = supabase
      .channel('dashboard-profile-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'students' }, 
        (payload) => handleDbChange(payload, 'Student profile')
      )
      .subscribe();
    
    return () => {
      console.log('Cleaning up Supabase subscriptions');
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(profileChannel);
      subscribedRef.current = false;
    };
  }, [loadData]);

  // Effect for filtering - runs whenever raw data or filters change
  useEffect(() => {
    console.log('Applying filters...');
    if (!builders.length) return;
    
    let results = [...builders]; // Start with the raw data
    
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
    
    console.log('Filtered results:', results.length);
    setFilteredBuilders(results);
  }, [builders, searchQuery, statusFilter]); // Correct dependencies

  const handleMarkAttendance = useCallback(async (builderId: string, status: BuilderStatus, excuseReason?: string) => {
    try {
      // Optimistic UI Update for better responsiveness
      setBuilders(prevBuilders => 
        prevBuilders.map(builder => 
          builder.id === builderId
            ? { 
                ...builder, 
                status: (status === 'absent' && excuseReason) ? 'excused' : status,
                excuseReason: (status === 'excused' || (status === 'absent' && excuseReason)) ? excuseReason : undefined,
                timeRecorded: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
              }
            : builder
        )
      );
      
      // Actual DB Update
      const success = await markAttendance(builderId, status, excuseReason);
      
      if (success) {
        const statusText = status === 'excused' ? 'Excused absence recorded' : `Attendance marked as ${status}`;
        toast.success(statusText);
        // No need to call loadData here, the subscription will handle it
      } else {
        toast.error('Failed to save attendance update');
        loadData(false); // Force reload on failure
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('An error occurred while updating attendance');
      loadData(false); // Force reload on error
    }
  }, [loadData]); // Depend on stable loadData for potential reverts

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);
  
  // Function to manually refresh data
  const loadBuilders = useCallback(() => {
    loadData(true); // Show loading indicator on manual refresh
  }, [loadData]);

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
    loadBuilders // Expose as loadBuilders for backward compatibility
  };
};
