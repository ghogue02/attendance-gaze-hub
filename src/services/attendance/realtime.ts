
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

let attendanceChannel: RealtimeChannel | null = null;
let lastCallbackTime = 0;
const DEBOUNCE_INTERVAL = 5000; // 5 seconds between callbacks

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

  // Track pending callbacks to avoid multiple rapid callbacks
  let callbackPending = false;
  
  // Create an efficient debounced callback
  const debouncedCallback = () => {
    const now = Date.now();
    // Only invoke the callback if sufficient time has passed since last invocation
    if (now - lastCallbackTime >= DEBOUNCE_INTERVAL) {
      console.log('Invoking attendance change callback after debounce');
      callback();
      lastCallbackTime = now;
      callbackPending = false;
    } else if (!callbackPending) {
      // Schedule a future callback if we haven't already
      callbackPending = true;
      setTimeout(() => {
        console.log('Executing delayed attendance change callback');
        callback();
        lastCallbackTime = Date.now();
        callbackPending = false;
      }, DEBOUNCE_INTERVAL - (now - lastCallbackTime));
    }
  };

  attendanceChannel = supabase
    .channel('attendance_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'attendance' },
      (payload) => {
        console.log('Attendance change detected!', payload);
        debouncedCallback();
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
