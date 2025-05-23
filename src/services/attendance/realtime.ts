
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { trackRequest } from '@/utils/debugging/requestTracker';
import { isWindowVisible, isOvernightHours } from '@/utils/date/dateUtils';
import { appVisibility } from '@/utils/visibility/appVisibility';

// Global debug flag - set to false to reduce console noise
const DEBUG_LOGGING = false;

// Global singleton channel for attendance changes
let attendanceChannel: RealtimeChannel | null = null;
let lastCallbackTime = 0;

// Increased debounce times to reduce database load
const NORMAL_DEBOUNCE_INTERVAL = 300000; // 5 minutes between callbacks
const OVERNIGHT_DEBOUNCE_INTERVAL = 3600000; // 1 hour overnight
const BACKGROUND_DEBOUNCE_INTERVAL = 1800000; // 30 minutes when tab is not visible

const callbackRegistry = new Set<() => void>();

// Track if we're already in a callback execution cycle
let executingCallbacks = false;

// Track subscription status to avoid duplicate subscriptions
let isSubscribing = false;
let lastSubscriptionFailure = 0;
const SUBSCRIPTION_RETRY_DELAY = 60000; // 1 minute between subscription attempts

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
    DEBUG_LOGGING && console.log('Using existing attendance subscription - added callback');
    return createUnsubscribeFunction(callback);
  }

  // Prevent multiple subscription attempts happening simultaneously
  // Also prevent frequent reconnection attempts if they fail
  const now = Date.now();
  if (isSubscribing || (now - lastSubscriptionFailure < SUBSCRIPTION_RETRY_DELAY)) {
    DEBUG_LOGGING && console.log('Subscription already in progress or recently failed, waiting...');
    return createUnsubscribeFunction(callback);
  }

  isSubscribing = true;
  
  // Create a single shared debounced callback for all subscribers
  const debouncedCallback = () => {
    // Skip if we're already executing callbacks
    if (executingCallbacks) {
      DEBUG_LOGGING && console.log('Already executing callbacks, skipping duplicate execution');
      return;
    }
    
    const now = Date.now();
    
    // Determine appropriate debounce interval based on conditions
    let debounceInterval = NORMAL_DEBOUNCE_INTERVAL;
    
    // Use longer interval during overnight hours
    if (isOvernightHours()) {
      debounceInterval = OVERNIGHT_DEBOUNCE_INTERVAL;
      DEBUG_LOGGING && console.log('Using overnight debounce interval (1 hour)');
    } 
    // Use longer interval when tab is not visible
    else if (!isWindowVisible()) {
      debounceInterval = BACKGROUND_DEBOUNCE_INTERVAL;
      DEBUG_LOGGING && console.log('Using background debounce interval (30 minutes)');
    }
    
    // Only invoke callbacks if sufficient time has passed since last invocation
    if (now - lastCallbackTime >= debounceInterval) {
      executingCallbacks = true;
      DEBUG_LOGGING && console.log(`Invoking ${callbackRegistry.size} attendance change callbacks after debounce`);
      
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
      DEBUG_LOGGING && console.log(`Debouncing callback (${Math.round((now - lastCallbackTime) / 1000)}s < ${debounceInterval / 1000}s interval)`);
    }
  };

  // Set up the channel if it doesn't exist
  DEBUG_LOGGING && console.log('Creating new attendance subscription channel');
  
  try {
    // Create a unique channel name to avoid conflicts
    const channelName = `optimized_global_attendance_changes_${Date.now()}`;
    
    attendanceChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'attendance'
        },
        (payload) => {
          trackRequest('attendanceChannel', 'event-received', payload.eventType);
          DEBUG_LOGGING && console.log('Attendance change detected:', payload.eventType);
          
          // Skip updates entirely when app is in background and it's overnight
          if (!isWindowVisible() && isOvernightHours()) {
            DEBUG_LOGGING && console.log('Skipping update - app in background during overnight hours');
            return;
          }
          
          // Apply extreme throttling to database updates
          // In a classroom setting, we don't need real-time updates to the second
          debouncedCallback();
        }
      )
      .subscribe((status) => {
        isSubscribing = false;
        
        if (status === 'SUBSCRIBED') {
          DEBUG_LOGGING && console.log('Successfully subscribed to attendance changes.');
        } else {
          console.warn('Subscription status:', status);
          
          // If subscription fails with CHANNEL_ERROR, try to clean up and prevent reconnect storm
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            trackRequest('attendanceChannel', 'subscription-error', status);
            lastSubscriptionFailure = Date.now();
            
            if (attendanceChannel) {
              // Clean up the broken channel
              try {
                attendanceChannel.unsubscribe();
                attendanceChannel = null;
              } catch (err) {
                console.error('Error removing channel:', err);
              }
            }
          }
        }
      });
      
    // Add visibility change handler to adjust refresh behavior
    appVisibility.subscribe((isVisible) => {
      if (isVisible) {
        // Trigger an immediate refresh when tab becomes visible again
        // but only if sufficient time has passed
        const now = Date.now();
        if (now - lastCallbackTime > 60000) { // At least 1 minute since last update
          DEBUG_LOGGING && console.log('Tab became visible, triggering refresh');
          debouncedCallback();
        }
      }
    });
    
  } catch (error) {
    console.error('Error setting up attendance channel:', error);
    isSubscribing = false;
    lastSubscriptionFailure = Date.now();
  }

  // Return unsubscribe function
  return createUnsubscribeFunction(callback);
};

function createUnsubscribeFunction(callback: () => void) {
  return () => {
    DEBUG_LOGGING && console.log('Unsubscribing callback from attendance changes.');
    
    // Remove just this callback
    callbackRegistry.delete(callback);
    
    // If no more callbacks and at least 5 minutes have passed, remove the channel
    if (callbackRegistry.size === 0 && attendanceChannel) {
      DEBUG_LOGGING && console.log('No more subscribers, cleaning up attendance channel');
      try {
        attendanceChannel.unsubscribe();
        attendanceChannel = null;
      } catch (err) {
        console.error('Error removing channel:', err);
      }
    }
  };
}
