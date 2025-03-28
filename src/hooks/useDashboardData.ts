
// src/hooks/useDashboardData.ts

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { getAllBuilders } from '@/utils/faceRecognition/attendance';
import { markAttendance } from '@/utils/attendance/markAttendance';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardData = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const isMounted = useRef(true);
  const subscriptionStatus = useRef({ attendance: 'unsubscribed', profile: 'unsubscribed' });

  // --- Get the current date properly ---
  // Create a new date and ensure it's the local date by setting to midnight and then getting ISO string
  const currentDate = useMemo(() => {
    const now = new Date();
    // Format as YYYY-MM-DD to avoid timezone issues
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);
  
  // Use the formatted date string directly without timezone conversion
  const targetDateString = currentDate;
  
  const displayDateString = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }, []);

  // Debugging the current date
  console.log(`[useDashboardData] Current date string: ${currentDate}, targetDateString: ${targetDateString}`);

  // Stable function to load/refresh data for the target date
  const loadData = useCallback(async (showLoadingSpinner = true) => {
    if (!isMounted.current) return;
    console.log(`[useDashboardData] Executing loadData for date ${targetDateString} (showLoading: ${showLoadingSpinner})...`);
    if (showLoadingSpinner) setIsLoading(true);
    try {
      // Pass the target date string to getAllBuilders
      const data = await getAllBuilders(targetDateString);
      if (isMounted.current) {
        setBuilders(data);
        console.log(`[useDashboardData] setBuilders called with ${data.length} builders for ${targetDateString}.`);
        console.log(`[useDashboardData] Present count: ${data.filter(b => b.status === 'present').length}`);
      }
    } catch (error) {
      console.error('[useDashboardData] Error during loadData:', error);
      if (isMounted.current) setBuilders([]);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [targetDateString]);

  // Effect for initial load and subscriptions
  useEffect(() => {
    isMounted.current = true;
    console.log('[useDashboardData] Component mounted. Setting up subscriptions and initial load.');
    loadData(); // Initial load for the target date

    // --- Realtime Subscriptions ---
    // Only trigger reload if the change affects the target date
    const handleDbChange = (payload: any, source: string) => {
      console.log(`[useDashboardData] ${source} change detected:`, payload.eventType);
      const changedDate = payload.new?.date || payload.old?.date;
      // Reload if the change was for the date we are currently displaying
      if (changedDate === targetDateString) {
         console.log(`[useDashboardData] Change affects target date ${targetDateString}. Reloading data.`);
         loadData(false); // Reload in background
      } else {
         console.log(`[useDashboardData] Change for date ${changedDate} ignored (target is ${targetDateString}).`);
      }
    };

    console.log('[useDashboardData] Subscribing to channels...');
    const attendanceChannel = supabase
      .channel('dashboard-attendance-realtime-v2') // Use unique channel names
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' }, // Consider filtering further if needed
        (payload) => handleDbChange(payload, 'Attendance')
      )
      .subscribe((status, err) => {
        subscriptionStatus.current.attendance = status;
        if (err) console.error('[useDashboardData] Attendance subscription error:', status, err);
        else console.log('[useDashboardData] Attendance subscription status:', status);
      });

    const profileChannel = supabase
      .channel('dashboard-profile-realtime-v2')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
         (payload) => {
            // Profile changes affect all dates, so always reload
            console.log('[useDashboardData] Student Profile change detected, reloading data.');
            loadData(false);
         }
      )
      .subscribe((status, err) => {
        subscriptionStatus.current.profile = status;
        if (err) console.error('[useDashboardData] Profile subscription error:', status, err);
        else console.log('[useDashboardData] Profile subscription status:', status);
      });

    // --- Cleanup ---
    return () => {
      isMounted.current = false;
      console.log('[useDashboardData] Component unmounting. Cleaning up subscriptions.');
      if (subscriptionStatus.current.attendance !== 'unsubscribed') supabase.removeChannel(attendanceChannel).catch(console.error);
      if (subscriptionStatus.current.profile !== 'unsubscribed') supabase.removeChannel(profileChannel).catch(console.error);
    };
  }, [loadData, targetDateString]);

  // Effect for filtering
  useEffect(() => {
    console.log('[useDashboardData] Filtering effect running...');
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
    console.log(`[useDashboardData] Setting filteredBuilders with ${results.length} builders.`);
    setFilteredBuilders(results);
  }, [builders, searchQuery, statusFilter]);

  // Handler for marking attendance
  const handleMarkAttendance = useCallback(async (builderId: string, status: BuilderStatus, excuseReason?: string) => {
    console.log(`[useDashboardData] handleMarkAttendance called for ${builderId} with status ${status} for date ${targetDateString}`);
    const originalBuilders = [...builders];
    try {
      const newStatus = (status === 'absent' && excuseReason) ? 'excused' : status;
      const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const newExcuse = (newStatus === 'excused') ? (excuseReason || originalBuilders.find(b => b.id === builderId)?.excuseReason) : undefined;

      // Optimistic Update
      setBuilders(prevBuilders =>
        prevBuilders.map(builder =>
          builder.id === builderId
            ? { ...builder, status: newStatus, excuseReason: newExcuse, timeRecorded: newTime }
            : builder
        )
      );

      // Explicitly pass the current date to markAttendance to ensure correct date recording
      const success = await markAttendance(builderId, status, excuseReason, targetDateString);

      if (success) {
        const statusText = newStatus === 'excused' ? 'Excused absence recorded' : `Attendance marked as ${newStatus}`;
        toast.success(statusText);
        // Subscription will trigger loadData if the date matches targetDateString
      } else {
        toast.error('Failed to save attendance update to database');
        if (isMounted.current) setBuilders(originalBuilders); // Revert
      }
    } catch (error) {
      console.error('[useDashboardData] Error marking attendance:', error);
      toast.error('An error occurred while updating attendance');
      if (isMounted.current) setBuilders(originalBuilders); // Revert
    }
  }, [builders, targetDateString, loadData]);

  // Handler to clear filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  // Function for manual refresh button
  const refreshData = useCallback(() => {
     console.log('[useDashboardData] Manual refresh triggered.');
     loadData(true);
  }, [loadData]);

  // Effect for filtering
  useEffect(() => {
    console.log('[useDashboardData] Filtering effect running...');
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
    console.log(`[useDashboardData] Setting filteredBuilders with ${results.length} builders.`);
    setFilteredBuilders(results);
  }, [builders, searchQuery, statusFilter]);

  // Return state and handlers
  return {
    builders,
    filteredBuilders,
    isLoading,
    searchQuery,
    statusFilter,
    selectedDate: displayDateString, // Use the formatted display date
    setSearchQuery,
    setStatusFilter,
    handleMarkAttendance,
    handleClearFilters,
    refreshData
  };
};
