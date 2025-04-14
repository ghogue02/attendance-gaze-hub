/**
 * Utility for tracking and logging Supabase REST requests
 */

let requestLog: {
  component: string;
  operation: string;
  timestamp: number;
  endpoint?: string;
}[] = [];

const MAX_LOG_ENTRIES = 100;

/**
 * Track a Supabase request with component and operation info
 */
export const trackRequest = (component: string, operation: string, endpoint?: string) => {
  // Add to beginning of array for most recent first
  requestLog.unshift({
    component,
    operation,
    timestamp: Date.now(),
    endpoint
  });
  
  // Keep log size limited
  if (requestLog.length > MAX_LOG_ENTRIES) {
    requestLog = requestLog.slice(0, MAX_LOG_ENTRIES);
  }
  
  // Log to console for immediate visibility
  console.log(`[RequestTracker] ${component} - ${operation}${endpoint ? ` - ${endpoint}` : ''}`);
};

/**
 * Get the current request log
 */
export const getRequestLog = () => {
  return [...requestLog];
};

/**
 * Clear the request log
 */
export const clearRequestLog = () => {
  requestLog = [];
};

/**
 * Print a summary of requests by component
 */
export const printRequestSummary = () => {
  const summary: Record<string, number> = {};
  
  requestLog.forEach(entry => {
    if (!summary[entry.component]) {
      summary[entry.component] = 0;
    }
    summary[entry.component]++;
  });
  
  console.log('===== REQUEST SUMMARY =====');
  Object.entries(summary)
    .sort((a, b) => b[1] - a[1])
    .forEach(([component, count]) => {
      console.log(`${component}: ${count} requests`);
    });
  console.log('==========================');
};
