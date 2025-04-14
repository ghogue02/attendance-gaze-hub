
import { setupRequestDebugging } from '@/integrations/supabase/trackedClient';
import { trackRequest } from './requestTracker';

export function initializeDebugTools() {
  // Initialize request tracking
  setupRequestDebugging();
  
  // Track page load
  trackRequest('AppInit', 'initialize', 'app-start');
  
  console.log('Debug tools initialized. Press Ctrl+Shift+D to print request summary.');
  
  // Add DOM instrumentation to help identify UI updates
  if (typeof window !== 'undefined') {
    // Override fetch to track network requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      // Handle both string URLs and Request objects
      let urlStr: string;
      if (typeof args[0] === 'string') {
        urlStr = args[0];
      } else if (args[0] instanceof Request) {
        urlStr = args[0].url;
      } else if (args[0] instanceof URL) {
        urlStr = args[0].toString();
      } else {
        urlStr = String(args[0]);
      }
      
      trackRequest('fetch', 'network-request', urlStr);
      return originalFetch.apply(this, args);
    };
    
    // Track hash/route changes
    window.addEventListener('hashchange', () => {
      trackRequest('Router', 'route-change', window.location.hash);
    });
  }
  
  return {
    logMessage: (component: string, message: string) => {
      trackRequest(component, message);
    }
  };
}
