
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Global singleton channel for attendance changes
let attendanceChannel: RealtimeChannel | null = null;
let lastCallbackTime = 0;

// Increased debounce time to significantly reduce database load
const DEBOUNCE_INTERVAL = 60000; // 1 minute between callbacks (increased from 30s)
const callbackRegistry = new Set<() => void>();

// Track if we're already in a callback execution cycle
let executingCallbacks = false;

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
    return createUnsubscribeFunction(callback);
  }

  // Track pending callbacks to avoid multiple rapid callbacks
  let callbackPending = false;
  
  // Create an efficient debounced callback that notifies all subscribers
  const debouncedCallback = () => {
    // Skip if we're already executing callbacks
    if (executingCallbacks) {
      console.log('Already executing callbacks, skipping duplicate execution');
      return;
    }
    
    const now = Date.now();
    
    // Only invoke callbacks if sufficient time has passed since last invocation
    if (now - lastCallbackTime >= DEBOUNCE_INTERVAL) {
      executingCallbacks = true;
      console.log(`Invoking ${callbackRegistry.size} attendance change callbacks after debounce`);
      
      try {
        // Notify all registered callbacks
        callbackRegistry.forEach(cb => {
          try {
            cb();
          } catch (err) {
            console.error('Error in attendance change callback:', err);
          }
        });
      } finally {
        lastCallbackTime = now;
        callbackPending = false;
        executingCallbacks = false;
      }
    } else if (!callbackPending) {
      // Schedule a future callback if we haven't already
      callbackPending = true;
      const delay = DEBOUNCE_INTERVAL - (now - lastCallbackTime);
      console.log(`Too soon for attendance callbacks, scheduling in ${delay}ms`);
      
      setTimeout(() => {
        executingCallbacks = true;
        console.log(`Executing delayed attendance callbacks for ${callbackRegistry.size} subscribers`);
        
        try {
          // Notify all registered callbacks
          callbackRegistry.forEach(cb => {
            try {
              cb();
            } catch (err) {
              console.error('Error in delayed attendance change callback:', err);
            }
          });
        } finally {
          lastCallbackTime = Date.now();
          callbackPending = false;
          executingCallbacks = false;
        }
      }, delay);
    }
  };

  // Set up the channel if it doesn't exist
  console.log('Creating new attendance subscription channel');
  attendanceChannel = supabase
    .channel('optimized_global_attendance_changes')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'attendance'
        // We're not filtering by date to have a single subscription
        // that handles all updates
      },
      (payload) => {
        console.log('Attendance change detected:', payload.eventType);
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
  return createUnsubscribeFunction(callback);
};

function createUnsubscribeFunction(callback: () => void) {
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
}
