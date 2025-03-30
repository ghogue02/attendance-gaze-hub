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

  useEffect(() => {
    isMounted.current = true;
    console.log('[useAttendanceSubscriptions] Setting up subscriptions for date:', targetDateString);

    // Handle database changes
    const handleDbChange = (payload: any, source: string) => {
      console.log(`[useAttendanceSubscriptions] ${source} change detected:`, payload.eventType);
      const changedDate = payload.new?.date || payload.old?.date;
      
      // Reload if the change was for the date we are currently displaying
      if (changedDate === targetDateString) {
        console.log(`[useAttendanceSubscriptions] Change affects target date ${targetDateString}. Reloading data.`);
        onDataChange();
      } else {
        console.log(`[useAttendanceSubscriptions] Change for date ${changedDate} ignored (target is ${targetDateString}).`);
      }
    };

    console.log('[useAttendanceSubscriptions] Subscribing to channels...');
    const attendanceChannel = supabase
      .channel('dashboard-attendance-realtime-v2')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => handleDbChange(payload, 'Attendance')
      )
      .subscribe((status, err) => {
        subscriptionStatus.current.attendance = status;
        if (err) console.error('[useAttendanceSubscriptions] Attendance subscription error:', status, err);
        else console.log('[useAttendanceSubscriptions] Attendance subscription status:', status);
      });

    const profileChannel = supabase
      .channel('dashboard-profile-realtime-v2')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => {
          // Profile changes affect all dates, so always reload
          console.log('[useAttendanceSubscriptions] Student Profile change detected, reloading data.');
          onDataChange();
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
    };
  }, [targetDateString, onDataChange]);
};
