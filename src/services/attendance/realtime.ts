
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

let attendanceChannel: RealtimeChannel | null = null;
let lastCallbackTime = 0;
const DEBOUNCE_INTERVAL = 10000; // 10 seconds between callbacks (increased from 5s)
const callbackRegistry = new Set<() => void>();

export const subscribeToAttendanceChanges = (callback: () => void) => {
  if (!supabase) {
    console.error('Supabase client is not initialized.');
    return () => {};
  }

  // Register the callback in our registry
  callbackRegistry.add(callback);
  
  // If we already have a channel active, just register this callback
  if (attendanceChannel) {
    console.log('Using existing attendance subscription - added callback');
    return () => {
      callbackRegistry.delete(callback);
      
      // If no more callbacks, remove the channel
      if (callbackRegistry.size === 0 && attendanceChannel) {
        console.log('No more subscribers, cleaning up attendance channel');
        supabase.removeChannel(attendanceChannel);
        attendanceChannel = null;
      }
    };
  }

  // Track pending callbacks to avoid multiple rapid callbacks
  let callbackPending = false;
  
  // Create an efficient debounced callback that notifies all subscribers
  const debouncedCallback = () => {
    const now = Date.now();
    // Only invoke callbacks if sufficient time has passed since last invocation
    if (now - lastCallbackTime >= DEBOUNCE_INTERVAL) {
      console.log(`Invoking ${callbackRegistry.size} attendance change callbacks after debounce`);
      
      // Notify all registered callbacks
      callbackRegistry.forEach(cb => {
        try {
          cb();
        } catch (err) {
          console.error('Error in attendance change callback:', err);
        }
      });
      
      lastCallbackTime = now;
      callbackPending = false;
    } else if (!callbackPending) {
      // Schedule a future callback if we haven't already
      callbackPending = true;
      const delay = DEBOUNCE_INTERVAL - (now - lastCallbackTime);
      console.log(`Too soon for attendance callbacks, scheduling in ${delay}ms`);
      
      setTimeout(() => {
        console.log(`Executing delayed attendance callbacks for ${callbackRegistry.size} subscribers`);
        
        // Notify all registered callbacks
        callbackRegistry.forEach(cb => {
          try {
            cb();
          } catch (err) {
            console.error('Error in delayed attendance change callback:', err);
          }
        });
        
        lastCallbackTime = Date.now();
        callbackPending = false;
      }, delay);
    }
  };

  // Set up the channel if it doesn't exist
  console.log('Creating new attendance subscription channel');
  attendanceChannel = supabase
    .channel('attendance_changes')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'attendance',
        // We're not filtering by date here because we want to catch all changes
        // but we'll debounce heavily to reduce load
      },
      (payload) => {
        console.log('Attendance change detected!', payload.eventType);
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

  // Return unsubscribe function
  return () => {
    console.log('Unsubscribing callback from attendance changes.');
    
    // Remove just this callback
    callbackRegistry.delete(callback);
    
    // If no more callbacks, remove the channel
    if (callbackRegistry.size === 0 && attendanceChannel) {
      console.log('No more subscribers, cleaning up attendance channel');
      supabase.removeChannel(attendanceChannel);
      attendanceChannel = null;
    }
  };
};
