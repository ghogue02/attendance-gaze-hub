// src/hooks/useDashboardData.ts

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { getAllBuilders } from '@/utils/faceRecognition/attendance'; // Adjusted path
import { markAttendance } from '@/utils/attendance/markAttendance';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardData = () => {
  // State for the raw, merged builder data (students + today's status)
  const [builders, setBuilders] = useState<Builder[]>([]);
  // State for the list displayed in the UI (after filtering)
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const subscribedRef = useRef(false); // To prevent setting up subscriptions multiple times

  // Memoize today's date string for display
  const selectedDate = useMemo(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }), []);

  // Stable function to load/refresh data from the database
  const loadData = useCallback(async (showLoadingIndicator = true) => {
    console.log('[useDashboardData] Executing loadData...');
    if (showLoadingIndicator) setIsLoading(true);
    try {
      // getAllBuilders now fetches students and merges today's attendance
      const data = await getAllBuilders();
      setBuilders(data); // Update the raw data state. Filtering happens in the next effect.
    } catch (error) {
      // Error is likely already logged/toasted in getAllBuilders
      console.error('[useDashboardData] Error during loadData:', error);
      setBuilders([]); // Clear data on error
    } finally {
      // Always turn off loading indicator, even if background refresh
      setIsLoading(false);
    }
  }, []); // Empty dependency array ensures this function reference is stable

  // Effect for initial data load and setting up Supabase subscriptions
  useEffect(() => {
    // Prevent duplicate subscriptions on fast re-renders
    if (subscribedRef.current) return;
    subscribedRef.current = true;
    console.log('[useDashboardData] Setting up Supabase subscriptions and initial load.');

    // --- Initial Load ---
    loadData();

    // --- Realtime Subscriptions ---
    const handleDbChange = (payload: any, source: string) => {
      console.log(`[useDashboardData] ${source} change detected:`, payload.eventType);
      // Reload data in the background without showing the main loading spinner
      loadData(false);
    };

    // Listen for changes in the attendance table
    const attendanceChannel = supabase
      .channel('dashboard-attendance-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => handleDbChange(payload, 'Attendance')
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[useDashboardData] Attendance subscription error:', err);
        } else {
          console.log('[useDashboardData] Attendance subscription status:', status);
        }
      });

    // Listen for changes in the students table (e.g., name, notes, image updates)
    const profileChannel = supabase
      .channel('dashboard-profile-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
         (payload) => handleDbChange(payload, 'Student Profile')
      )
      .subscribe((status, err) => {
         if (err) {
          console.error('[useDashboardData] Profile subscription error:', err);
        } else {
          console.log('[useDashboardData] Profile subscription status:', status);
        }
      });

    // --- Cleanup Function ---
    return () => {
      console.log('[useDashboardData] Cleaning up Supabase subscriptions.');
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(profileChannel);
      subscribedRef.current = false; // Reset ref on unmount
    };
  }, [loadData]); // Depend only on the stable loadData function

  // Effect for filtering the displayed list - runs whenever raw data or filters change
  useEffect(() => {
    console.log('[useDashboardData] Applying filters...');
    let results = [...builders]; // Start with the raw, merged data

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(builder =>
        builder.name.toLowerCase().includes(query) ||
        (builder.builderId && builder.builderId.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(builder => builder.status === statusFilter);
    }

    console.log(`[useDashboardData] Filtered ${results.length} builders.`);
    setFilteredBuilders(results);
  }, [builders, searchQuery, statusFilter]); // Re-run whenever these change

  // Handler for marking attendance via dashboard buttons
  const handleMarkAttendance = useCallback(async (builderId: string, status: BuilderStatus, excuseReason?: string) => {
    console.log(`[useDashboardData] handleMarkAttendance called for ${builderId} with status ${status}`);
    const originalBuilders = builders; // Keep original state for potential revert
    try {
      // --- Optimistic UI Update ---
      // Update the local state immediately for better perceived performance
      setBuilders(prevBuilders =>
        prevBuilders.map(builder =>
          builder.id === builderId
            ? {
                ...builder,
                // Determine the correct status based on input (especially for 'excused')
                status: (status === 'absent' && excuseReason) ? 'excused' : status,
                excuseReason: (status === 'excused' || (status === 'absent' && excuseReason)) ? (excuseReason || builder.excuseReason) : undefined, // Keep existing reason if marking excused without new one
                timeRecorded: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) // Update time locally
              }
            : builder
        )
      );
      // Note: The filtering useEffect will automatically update filteredBuilders

      // --- Actual Database Update ---
      const success = await markAttendance(builderId, status, excuseReason);

      if (success) {
        const statusText = status === 'excused' ? 'Excused absence recorded' : `Attendance marked as ${status}`;
        toast.success(statusText);
        // Data will be refreshed via the subscription, no need to call loadData here
      } else {
        toast.error('Failed to save attendance update to database');
        // Revert optimistic update on failure
        setBuilders(originalBuilders);
      }
    } catch (error) {
      console.error('[useDashboardData] Error marking attendance:', error);
      toast.error('An error occurred while updating attendance');
      // Revert optimistic update on error
      setBuilders(originalBuilders);
    }
  }, [builders]); // Include builders in dependency for reverting

  // Handler to clear search and status filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  // Function to manually trigger a data refresh (e.g., for a refresh button)
  const refreshData = useCallback(() => {
     console.log('[useDashboardData] Manual refresh triggered.');
     loadData(true); // Pass true to show the loading indicator
  }, [loadData]);

  // Return all the state and handlers needed by the Dashboard page
  return {
    builders, // The raw, merged data (for StatisticsCards, AnalyticsTab)
    filteredBuilders, // Filtered data (for BuildersList in BuildersTab)
    isLoading,
    searchQuery,
    statusFilter,
    selectedDate, // The display date string
    setSearchQuery,
    setStatusFilter,
    handleMarkAttendance,
    handleClearFilters,
    refreshData // Expose the manual refresh function
  };
};