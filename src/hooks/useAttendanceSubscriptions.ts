
import { useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionParams {
  targetDateString: string;
  onDataChange: () => void;
}

/**
 * Hook to manage real-time Supabase subscriptions for attendance data
 * Optimized to reduce connection overhead
 */
export const useAttendanceSubscriptions = ({ 
  targetDateString, 
  onDataChange 
}: SubscriptionParams): void => {
  const isMounted = useRef(true);
  const lastChangeTimestamp = useRef<number>(Date.now());
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const activeSubscriptionsRef = useRef<{
    attendance: boolean;
    profile: boolean;
  }>({ attendance: false, profile: false });
  
  useEffect(() => {
    isMounted.current = true;
    console.log('[useAttendanceSubscriptions] Setting up subscriptions for date:', targetDateString);

    // Extended debounce time to further reduce database load
    const DEBOUNCE_TIME = 3000; // 3 seconds (up from 2)
    const MIN_RELOAD_INTERVAL = 10000; // 10 seconds minimum between reloads (up from 5)

    // Handle database changes with debouncing for attendance
    const handleDbChange = (payload: any, source: string) => {
      console.log(`[useAttendanceSubscriptions] ${source} change detected:`, payload.eventType);
      
      // For attendance changes, check if it affects our target date
      if (source === 'Attendance') {
        const changedDate = payload.new?.date || payload.old?.date;
        
        // Only handle changes for the current target date
        if (changedDate !== targetDateString) {
          console.log(`[useAttendanceSubscriptions] Change for date ${changedDate} ignored (target is ${targetDateString}).`);
          return; // Skip if not for our target date
        }
        
        console.log(`[useAttendanceSubscriptions] Change affects target date ${targetDateString}.`);
      }
      
      // Clear any existing timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      // Set a new timeout to reload data after debounce period
      debounceTimeout.current = setTimeout(() => {
        // Only reload if it's been at least MIN_RELOAD_INTERVAL since the last reload
        const now = Date.now();
        if (now - lastChangeTimestamp.current > MIN_RELOAD_INTERVAL) {
          console.log('[useAttendanceSubscriptions] Debounced reload triggered');
          onDataChange();
          lastChangeTimestamp.current = now;
        } else {
          console.log('[useAttendanceSubscriptions] Skipping reload - too soon after last reload');
        }
      }, DEBOUNCE_TIME);
    };

    // Only subscribe to the attendance channel if we haven't already
    let attendanceChannel;
    if (!activeSubscriptionsRef.current.attendance) {
      console.log('[useAttendanceSubscriptions] Creating attendance channel subscription');
      
      attendanceChannel = supabase
        .channel('dashboard-attendance-optimized')
        .on('postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'attendance',
            filter: `date=eq.${targetDateString}`  // Filter to only get changes for this specific date
          },
          (payload) => handleDbChange(payload, 'Attendance')
        )
        .subscribe((status) => {
          activeSubscriptionsRef.current.attendance = (status === 'SUBSCRIBED');
          console.log('[useAttendanceSubscriptions] Attendance subscription status:', status);
        });
    }

    // For student profile changes, we'll use a shared channel with less frequent updates
    let profileChannel;
    if (!activeSubscriptionsRef.current.profile) {
      console.log('[useAttendanceSubscriptions] Creating profile channel subscription');
      
      profileChannel = supabase
        .channel('dashboard-profile-optimized')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'students' },
          (payload) => {
            // For profile changes, be very conservative with reloads
            const now = Date.now();
            if (now - lastChangeTimestamp.current > MIN_RELOAD_INTERVAL * 2) { // Double the interval for profile changes
              console.log('[useAttendanceSubscriptions] Student Profile change detected, reloading data');
              onDataChange();
              lastChangeTimestamp.current = now;
            } else {
              console.log('[useAttendanceSubscriptions] Skipping reload after profile change - too soon after last reload');
            }
          }
        )
        .subscribe((status) => {
          activeSubscriptionsRef.current.profile = (status === 'SUBSCRIBED');
          console.log('[useAttendanceSubscriptions] Profile subscription status:', status);
        });
    }

    // Cleanup subscriptions
    return () => {
      isMounted.current = false;
      console.log('[useAttendanceSubscriptions] Component unmounting. Cleaning up subscriptions.');
      
      if (attendanceChannel) {
        supabase.removeChannel(attendanceChannel);
        activeSubscriptionsRef.current.attendance = false;
      }
      
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
        activeSubscriptionsRef.current.profile = false;
      }
      
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [targetDateString, onDataChange]);
};
