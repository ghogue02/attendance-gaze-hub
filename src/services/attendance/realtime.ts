
import { trackedSupabase as supabase } from '@/integrations/supabase/trackedClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { trackRequest } from '@/utils/debugging/requestTracker';

// Global singleton channel for attendance changes
let attendanceChannel: RealtimeChannel | null = null;
let lastCallbackTime = 0;

// Significantly increased debounce time to reduce database load
const DEBOUNCE_INTERVAL = 180000; // 3 minutes between callbacks (increased from 1 minute)
const callbackRegistry = new Set<() => void>();

// Track if we're already in a callback execution cycle
let executingCallbacks = false;

// Track subscription status to avoid duplicate subscriptions
let isSubscribing = false;

export const subscribeToAttendanceChanges = (callback: () => void) => {
  trackRequest('subscribeToAttendanceChanges', 'create-subscription');
  
  if (!supabase) {
    console.error('Supabase client is not initialized.');
    return () => {};
  }

  // Register the callback in our registry without triggering new subscriptions
  callbackRegistry.add(callback);
  
  // If we already have a channel active, just register this callback
  if (attendanceChannel) {
    console.log('Using existing attendance subscription - added callback');
    return createUnsubscribeFunction(callback);
  }

  // Prevent multiple subscription attempts happening simultaneously
  if (isSubscribing) {
    console.log('Subscription already in progress, waiting...');
    return createUnsubscribeFunction(callback);
  }

  isSubscribing = true;
  
  // Create a single shared debounced callback for all subscribers
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
        // Execute a single callback that will refresh data for all subscribers
        // This prevents multiple database queries for the same data
        if (callbackRegistry.size > 0) {
          const firstCallback = Array.from(callbackRegistry)[0];
          firstCallback();
        }
      } finally {
        lastCallbackTime = now;
        executingCallbacks = false;
      }
    } else {
      console.log(`Debouncing callback (${Math.round((now - lastCallbackTime) / 1000)}s < ${DEBOUNCE_INTERVAL / 1000}s interval)`);
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
      },
      (payload) => {
        trackRequest('attendanceChannel', 'event-received', payload.eventType);
        console.log('Attendance change detected:', payload.eventType);
        // Apply extreme throttling to database updates
        // In a classroom setting, we don't need real-time updates to the second
        debouncedCallback();
      }
    )
    .subscribe((status) => {
      isSubscribing = false;
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to attendance changes.');
      } else {
        console.warn('Subscription status:', status);
        
        // If subscription fails with CHANNEL_ERROR, try to clean up and prevent reconnect storm
        if (status === 'CHANNEL_ERROR') {
          trackRequest('attendanceChannel', 'subscription-error', status);
          if (attendanceChannel) {
            // Remove the broken channel
            try {
              supabase.removeAllChannels();
              attendanceChannel = null;
              
              // Add a delay to prevent immediate reconnection attempts
              console.log('Channel error detected, preventing reconnect for 30 seconds');
              setTimeout(() => {
                isSubscribing = false;
              }, 30000);
            } catch (err) {
              console.error('Error removing channel:', err);
            }
          }
        }
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
      try {
        supabase.removeAllChannels();
        attendanceChannel = null;
      } catch (err) {
        console.error('Error removing channel:', err);
      }
    }
  };
}
