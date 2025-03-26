
import { useState, useCallback, memo } from 'react';
import { Builder } from '@/components/builder/types';
import AttendanceHistory from './AttendanceHistory';
import AttendanceErrorDisplay from './AttendanceErrorDisplay';

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
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Attendance History</h2>
      </div>
      
      {error && (
        <AttendanceErrorDisplay 
          message={error}
          onRetry={handleRetry}
        />
      )}
      
      <AttendanceHistory 
        key={refreshKey}
        builders={builders} 
        onError={handleError}
      />
    </div>
  );
});

HistoryTab.displayName = 'HistoryTab';

export default HistoryTab;
