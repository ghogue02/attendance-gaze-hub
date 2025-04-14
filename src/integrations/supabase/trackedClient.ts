
/**
 * Enhanced Supabase client with request tracking
 */

import { supabase } from './client';
import { trackRequest } from '@/utils/debugging/requestTracker';

// Get the original client methods
const originalFrom = supabase.from;
const originalChannel = supabase.channel;
const originalRpc = supabase.rpc;
const originalStorage = supabase.storage;

// Create a tracked proxy for the Supabase client
const trackedSupabase = {
  ...supabase,
  
  // Track table operations
  from: (table: string) => {
    const componentStack = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
    trackRequest(extractComponentName(componentStack), 'from', table);
    return originalFrom(table);
  },
  
  // Track realtime subscriptions
  channel: (channel: string) => {
    const componentStack = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
    trackRequest(extractComponentName(componentStack), 'channel', channel);
    return originalChannel(channel);
  },
  
  // Track RPC calls
  rpc: (fn: string, ...args: any[]) => {
    const componentStack = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
    trackRequest(extractComponentName(componentStack), 'rpc', fn);
    return originalRpc(fn, ...args);
  },
  
  // Track storage operations
  storage: (bucket: string) => {
    const componentStack = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
    trackRequest(extractComponentName(componentStack), 'storage', bucket);
    return originalStorage(bucket);
  }
};

// Extract component name from stack trace
function extractComponentName(stack: string): string {
  // Try to extract a meaningful component name from the stack
  const fileMatch = stack.match(/([A-Za-z0-9_]+\.[jt]sx?)/);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }
  
  // If we can't determine file, check for hook or component name pattern
  const hookMatch = stack.match(/\s+at\s+([A-Za-z0-9_]+)/);
  if (hookMatch && hookMatch[1]) {
    return hookMatch[1];
  }
  
  return 'unknown';
}

// Create a debugging utility for the current page
export function setupRequestDebugging() {
  // Add a keyboard shortcut to print request summary
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      // Ctrl+Shift+D to print debug summary
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        import('@/utils/debugging/requestTracker').then(({ printRequestSummary }) => {
          printRequestSummary();
        });
      }
    });
    
    console.log('Request debugging enabled. Press Ctrl+Shift+D to print request summary.');
  }
}

export { trackedSupabase };

// Export as default so it can be used as a drop-in replacement
export default trackedSupabase;
