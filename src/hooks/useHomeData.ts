
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    trackRequest('Home', 'component-mount');
    
    const loadBuilders = async () => {
      setLoading(true);
      try {
        const today = getCurrentDateString();
        console.log(`Home: Loading builders for date: ${today}`);
        trackRequest('Home', 'load-builders', today);
        
        const data = await getAllBuilders(today);
        console.log(`Home: Loaded ${data.length} builders, ${data.filter(b => b.status === 'present').length} present`);
        setBuilders(data);
        trackRequest('Home', 'builders-loaded', `count: ${data.length}`);
      } catch (error) {
        console.error('Error loading builders:', error);
        trackRequest('Home', 'load-error', String(error));
      } finally {
        setLoading(false);
      }
    };

    loadBuilders();
    
    let unsubscribe: () => void;
    
    const subscriptionTimeout = setTimeout(() => {
      trackRequest('Home', 'setup-subscription');
      unsubscribe = subscribeToAttendanceChanges(() => {
        console.log('Home: Attendance change detected, reloading builders');
        trackRequest('Home', 'subscription-triggered');
        clearAttendanceCache(getCurrentDateString());
        loadBuilders();
      });
    }, 2000);
    
    return () => {
      trackRequest('Home', 'component-unmount');
      clearTimeout(subscriptionTimeout);
      if (unsubscribe) {
        unsubscribe();
      }
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
