
import { useState, useEffect, useRef } from 'react';
import { Builder } from '@/components/builder/types';
import { getAllBuilders, clearAttendanceCache } from '@/utils/faceRecognition/attendance';
import { getCurrentDateString } from '@/utils/date/dateUtils';
import { subscribeToAttendanceChanges } from '@/services/attendance/realtime';
import { trackRequest } from '@/utils/debugging/requestTracker';

export const useHomeData = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [detectedBuilder, setDetectedBuilder] = useState<Builder | null>(null);
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  
  // Add refs inside the hook function body
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    trackRequest('Home', 'component-mount');
    isMountedRef.current = true;
    
    const loadBuilders = async () => {
      // Prevent duplicate requests
      if (isLoadingRef.current) return;
      
      isLoadingRef.current = true;
      setLoading(true);
      
      try {
        const today = getCurrentDateString();
        console.log(`Home: Loading builders for date: ${today}`);
        trackRequest('Home', 'load-builders', today);
        
        const data = await getAllBuilders(today);
        
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) return;
        
        console.log(`Home: Loaded ${data.length} builders, ${data.filter(b => b.status === 'present').length} present`);
        setBuilders(data);
        trackRequest('Home', 'builders-loaded', `count: ${data.length}`);
      } catch (error) {
        console.error('Error loading builders:', error);
        trackRequest('Home', 'load-error', String(error));
      } finally {
        // Check if component is still mounted before updating state
        if (isMountedRef.current) {
          setLoading(false);
        }
        isLoadingRef.current = false;
      }
    };

    loadBuilders();
    
    // Define these variables inside the effect to avoid issues with hooks
    let unsubscribe: (() => void) | undefined;
    let subscriptionTimeout: NodeJS.Timeout | undefined;
    
    // Use a ref to handle subscription status - but create it inside the hook
    const hasActiveSubscription = { current: false };
    
    // Set up real-time subscription with debounce to prevent rapid refreshes
    subscriptionTimeout = setTimeout(() => {
      if (!hasActiveSubscription.current) {
        trackRequest('Home', 'setup-subscription');
        hasActiveSubscription.current = true;
        
        unsubscribe = subscribeToAttendanceChanges(() => {
          console.log('Home: Attendance change detected, reloading builders');
          trackRequest('Home', 'subscription-triggered');
          
          // Use the cached data if it's recent, otherwise clear cache
          const cacheAge = Date.now() - (window.__attendanceCache?.timestamp || 0);
          if (cacheAge > 60000) { // If cache is older than 1 minute
            clearAttendanceCache(getCurrentDateString());
          }
          
          // Debounce multiple update events
          if (!isLoadingRef.current) {
            loadBuilders();
          }
        });
      }
    }, 2000);
    
    return () => {
      isMountedRef.current = false;
      trackRequest('Home', 'component-unmount');
      if (subscriptionTimeout) {
        clearTimeout(subscriptionTimeout);
      }
      if (unsubscribe) {
        unsubscribe();
      }
      hasActiveSubscription.current = false;
    };
  }, []);

  const handleBuilderDetected = (builder: Builder) => {
    trackRequest('Home', 'builder-detected', builder.name);
    setDetectedBuilder(builder);
  };

  const handleReset = () => {
    trackRequest('Home', 'reset');
    setDetectedBuilder(null);
    setSelectedBuilder(null);
  };

  const handleSelectBuilder = (builder: Builder) => {
    setSelectedBuilder(builder);
    trackRequest('Home', 'select-builder', builder.name);
  };

  return {
    builders,
    loading,
    detectedBuilder,
    selectedBuilder,
    handleBuilderDetected,
    handleSelectBuilder,
    handleReset
  };
};
