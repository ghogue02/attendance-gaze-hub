// src/hooks/useDashboardData.ts

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { getAllBuilders } from '@/utils/faceRecognition/attendance'; // Ensure path is correct
import { markAttendance } from '@/utils/attendance/markAttendance';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardData = () => {
  const [builders, setBuilders] = useState<Builder[]>([]); // Raw, merged data
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]); // For UI lists
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const isMounted = useRef(true); // Track mount status for async operations
  const subscriptionStatus = useRef({ attendance: 'unsubscribed', profile: 'unsubscribed' }); // Track subscription status

  // Memoize the display date string
  const selectedDate = useMemo(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }), []);

  // Stable function to load/refresh data
  // Renamed parameter for clarity
  const loadData = useCallback(async (showLoadingSpinner = true) => {
    // Only proceed if the component is still mounted
    if (!isMounted.current) {
      console.log('[useDashboardData] loadData skipped: component unmounted.');
      return;
    }
    console.log(`[useDashboardData] Executing loadData (showLoading: ${showLoadingSpinner})...`);
    if (showLoadingSpinner) setIsLoading(true);
    try {
      const data = await getAllBuilders(); // Fetches students + today's attendance status
      // Check mount status again before setting state
      if (isMounted.current) {
        setBuilders(data);
        console.log(`[useDashboardData] setBuilders called with ${data.length} builders.`);
      } else {
         console.log('[useDashboardData] loadData response received, but component unmounted before setting state.');
      }
    } catch (error) {
      console.error('[useDashboardData] Error during loadData:', error);
      if (isMounted.current) {
        setBuilders([]); // Clear data on error
      }
    } finally {
      // Check mount status again before setting state
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []); // Empty dependency array - stable function reference

  // Effect for initial load and subscriptions
  useEffect(() => {
    isMounted.current = true; // Mark as mounted
    console.log('[useDashboardData] Component mounted. Setting up subscriptions and initial load.');

    // --- Initial Load ---
    loadData();

    // --- Realtime Subscriptions ---
    const handleDbChange = (payload: any, source: string) => {
      console.log(`[useDashboardData] ${source} change detected:`, payload.eventType);
      // Reload data in the background
      loadData(false);
    };

    console.log('[useDashboardData] Subscribing to channels...');
    const attendanceChannel = supabase
      .channel('dashboard-attendance-realtime') // Use a unique channel name
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => handleDbChange(payload, 'Attendance')
      )
      .subscribe((status, err) => {
        subscriptionStatus.current.attendance = status;
        if (err) console.error('[useDashboardData] Attendance subscription error:', status, err);
        else console.log('[useDashboardData] Attendance subscription status:', status);
      });

    const profileChannel = supabase
      .channel('dashboard-profile-realtime') // Use a unique channel name
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
         (payload) => handleDbChange(payload, 'Student Profile')
      )
      .subscribe((status, err) => {
        subscriptionStatus.current.profile = status;
        if (err) console.error('[useDashboardData] Profile subscription error:', status, err);
        else console.log('[useDashboardData] Profile subscription status:', status);
      });

    // --- Cleanup Function ---
    return () => {
      isMounted.current = false; // Mark as unmounted
      console.log('[useDashboardData] Component unmounting. Cleaning up subscriptions.');
      // Only attempt removal if subscribed
      if (subscriptionStatus.current.attendance !== 'unsubscribed') {
        supabase.removeChannel(attendanceChannel).then(status => console.log('[useDashboardData] Attendance channel removal status:', status));
      }
      if (subscriptionStatus.current.profile !== 'unsubscribed') {
         supabase.removeChannel(profileChannel).then(status => console.log('[useDashboardData] Profile channel removal status:', status));
      }
    };
  }, [loadData]); // Depend only on the stable loadData function

  // Effect for filtering the displayed list
  useEffect(() => {
    console.log('[useDashboardData] Filtering effect running...');
    let results = [...builders]; // Use the raw 'builders' state

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

    console.log(`[useDashboardData] Setting filteredBuilders with ${results.length} builders.`);
    setFilteredBuilders(results);
  }, [builders, searchQuery, statusFilter]); // Correct dependencies

  // Handler for marking attendance (manual override / button click)
  const handleMarkAttendance = useCallback(async (builderId: string, status: BuilderStatus, excuseReason?: string) => {
    console.log(`[useDashboardData] handleMarkAttendance called for ${builderId} with status ${status}`);
    const originalBuilders = [...builders]; // Create a shallow copy for potential revert

    try {
      // --- Optimistic UI Update ---
      const newStatus = (status === 'absent' && excuseReason) ? 'excused' : status;
      const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const newExcuse = (newStatus === 'excused') ? (excuseReason || originalBuilders.find(b => b.id === builderId)?.excuseReason) : undefined;

      setBuilders(prevBuilders =>
        prevBuilders.map(builder =>
          builder.id === builderId
            ? { ...builder, status: newStatus, excuseReason: newExcuse, timeRecorded: newTime }
            : builder
        )
      );

      // --- Actual Database Update ---
      const success = await markAttendance(builderId, status, excuseReason);

      if (success) {
        const statusText = newStatus === 'excused' ? 'Excused absence recorded' : `Attendance marked as ${newStatus}`;
        toast.success(statusText);
        // Let the subscription handle the final state update from DB
      } else {
        toast.error('Failed to save attendance update to database');
        // Revert optimistic update on failure
        if (isMounted.current) setBuilders(originalBuilders);
      }
    } catch (error) {
      console.error('[useDashboardData] Error marking attendance:', error);
      toast.error('An error occurred while updating attendance');
      // Revert optimistic update on error
      if (isMounted.current) setBuilders(originalBuilders);
    }
  }, [builders]); // Include builders for revert logic

  // Handler to clear filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  // Function for manual refresh button
  const refreshData = useCallback(() => {
     console.log('[useDashboardData] Manual refresh triggered.');
     loadData(true); // Show loading indicator
  }, [loadData]);

  // Return state and handlers
  return {
    builders,           // Raw, merged data for stats/analytics
    filteredBuilders,   // Filtered data for lists
    isLoading,
    searchQuery,
    statusFilter,
    selectedDate,       // Formatted date string
    setSearchQuery,
    setStatusFilter,
    handleMarkAttendance,
    handleClearFilters,
    refreshData         // Manual refresh function
  };
};