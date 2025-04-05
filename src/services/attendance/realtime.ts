
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

let attendanceChannel: RealtimeChannel | null = null;

export const subscribeToAttendanceChanges = (callback: () => void) => {
  if (!supabase) {
    console.error('Supabase client is not initialized.');
    return () => {};
  }

  if (attendanceChannel) {
    console.log('Already subscribed to attendance changes, detaching previous subscription.');
    supabase.removeChannel(attendanceChannel);
    attendanceChannel = null;
  }

  attendanceChannel = supabase
    .channel('attendance_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'attendance' },
      (payload) => {
        console.log('Attendance change detected!', payload);
        callback();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to attendance changes.');
      } else {
        console.warn('Subscription status:', status);
      }
    });

  return () => {
    console.log('Unsubscribing from attendance changes.');
    if (attendanceChannel) {
      supabase.removeChannel(attendanceChannel);
      attendanceChannel = null;
    }
  };
};
