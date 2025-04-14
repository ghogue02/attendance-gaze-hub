
import { useEffect } from 'react';
import { subscribeToAttendanceChanges } from '@/services/attendance/realtime';
import { getCachedData, setCachedData } from '@/utils/attendance/cacheManager';

interface UseAttendanceSubscriptionsProps {
  targetDateString: string;
  onDataChange: () => void;
  disableSubscription?: boolean;
}

export const useAttendanceSubscriptions = ({
  targetDateString,
  onDataChange,
  disableSubscription = false
}: UseAttendanceSubscriptionsProps) => {

  useEffect(() => {
    // Skip subscription if disabled
    if (disableSubscription) {
      console.log('[useAttendanceSubscriptions] Subscriptions are disabled');
      return;
    }

    // Check if we've initiated this subscription recently using the cache
    const cacheKey = `attendance_subscription_${targetDateString}`;
    const recentSubscription = getCachedData<boolean>(cacheKey);

    if (recentSubscription) {
      console.log(`[useAttendanceSubscriptions] Recent subscription detected for ${targetDateString}, skipping`);
      return;
    }

    console.log(`[useAttendanceSubscriptions] Setting up subscription for date: ${targetDateString}`);
    
    // Record this subscription in the cache with a 10-second TTL to prevent duplicates
    setCachedData(cacheKey, true, 10000);
    
    // Set up the subscription with a callback that is resource-efficient
    const unsubscribe = subscribeToAttendanceChanges(onDataChange);
    
    return () => {
      console.log('[useAttendanceSubscriptions] Cleaning up attendance subscription');
      unsubscribe();
    };
  }, [targetDateString, onDataChange, disableSubscription]);
};
