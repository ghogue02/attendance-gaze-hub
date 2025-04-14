
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
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      trackRequest('fetch', 'network-request', url);
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
