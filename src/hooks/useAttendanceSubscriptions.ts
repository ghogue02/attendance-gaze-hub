
import { useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionParams {
  targetDateString: string;
  onDataChange: () => void;
}

/**
 * Hook to manage real-time Supabase subscriptions for attendance data
 */
export const useAttendanceSubscriptions = ({ 
  targetDateString, 
  onDataChange 
}: SubscriptionParams): void => {
  const isMounted = useRef(true);
  const subscriptionStatus = useRef({ attendance: 'unsubscribed', profile: 'unsubscribed' });
  const lastChangeTimestamp = useRef<number>(Date.now());
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    console.log('[useAttendanceSubscriptions] Setting up subscriptions for date:', targetDateString);

    // Handle database changes with debouncing for attendance
    const handleDbChange = (payload: any, source: string) => {
      console.log(`[useAttendanceSubscriptions] ${source} change detected:`, payload.eventType);
      const changedDate = payload.new?.date || payload.old?.date;
      
      // Only handle changes for the current target date
      if (changedDate === targetDateString) {
        console.log(`[useAttendanceSubscriptions] Change affects target date ${targetDateString}.`);
        
        // Clear any existing timeout
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
        
        // Set a new timeout to reload data after 2 seconds of inactivity
        debounceTimeout.current = setTimeout(() => {
          // Only reload if it's been at least 5 seconds since the last reload
          const now = Date.now();
          if (now - lastChangeTimestamp.current > 5000) {
            console.log('[useAttendanceSubscriptions] Debounced reload triggered');
            onDataChange();
            lastChangeTimestamp.current = now;
          } else {
            console.log('[useAttendanceSubscriptions] Skipping reload - too soon after last reload');
          }
        }, 2000);
      } else {
        console.log(`[useAttendanceSubscriptions] Change for date ${changedDate} ignored (target is ${targetDateString}).`);
      }
    };

    console.log('[useAttendanceSubscriptions] Subscribing to channels...');
    
    // Only subscribe to changes for the specific target date
    const attendanceChannel = supabase
      .channel('dashboard-attendance-realtime-v2')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'attendance',
          filter: `date=eq.${targetDateString}`  // Filter to only get changes for this specific date
        },
        (payload) => handleDbChange(payload, 'Attendance')
      )
      .subscribe((status, err) => {
        subscriptionStatus.current.attendance = status;
        if (err) console.error('[useAttendanceSubscriptions] Attendance subscription error:', status, err);
        else console.log('[useAttendanceSubscriptions] Attendance subscription status:', status);
      });

    // For student profile changes, we still need to listen to all changes
    // but we'll be more selective about when we trigger a reload
    const profileChannel = supabase
      .channel('dashboard-profile-realtime-v2')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => {
          // For profile changes, let's be very conservative with reloads
          const now = Date.now();
          if (now - lastChangeTimestamp.current > 10000) { // 10 seconds minimum between reloads
            console.log('[useAttendanceSubscriptions] Student Profile change detected, reloading data.');
            onDataChange();
            lastChangeTimestamp.current = now;
          } else {
            console.log('[useAttendanceSubscriptions] Skipping reload after profile change - too soon after last reload');
          }
        }
      )
      .subscribe((status, err) => {
        subscriptionStatus.current.profile = status;
        if (err) console.error('[useAttendanceSubscriptions] Profile subscription error:', status, err);
        else console.log('[useAttendanceSubscriptions] Profile subscription status:', status);
      });

    // Cleanup subscriptions
    return () => {
      isMounted.current = false;
      console.log('[useAttendanceSubscriptions] Component unmounting. Cleaning up subscriptions.');
      if (subscriptionStatus.current.attendance !== 'unsubscribed') supabase.removeChannel(attendanceChannel).catch(console.error);
      if (subscriptionStatus.current.profile !== 'unsubscribed') supabase.removeChannel(profileChannel).catch(console.error);
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [targetDateString, onDataChange]);
};
