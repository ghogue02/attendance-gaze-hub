
import { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import AttendanceHistory from './AttendanceHistory';
import AttendanceErrorDisplay from './AttendanceErrorDisplay';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface HistoryTabProps {
  builders: Builder[];
}

const HistoryTab = memo(({ builders }: HistoryTabProps) => {
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRetry = useCallback(() => {
    setError(null);
    setRefreshKey(prev => prev + 1);
  }, []);
  
  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);
  
  // Memoize the builders array to prevent unnecessary re-renders
  const memoizedBuilders = useMemo(() => builders, [builders]);
  
  return (
    <div className="space-y-6">      
      {error && (
        <AttendanceErrorDisplay 
          message={error}
          onRetry={handleRetry}
        />
      )}
      
      <AttendanceHistory 
        key={refreshKey}
        builders={memoizedBuilders} 
        onError={handleError}
      />
    </div>
  );
});

HistoryTab.displayName = 'HistoryTab';

export default HistoryTab;
