
import { useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import AttendanceHistory from './AttendanceHistory';
import AttendanceErrorDisplay from './AttendanceErrorDisplay';
import { toast } from 'sonner';

interface HistoryTabProps {
  builders: Builder[];
}

const HistoryTab = ({ builders }: HistoryTabProps) => {
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRetry = () => {
    setError(null);
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    // Clear any previous errors when component mounts or refreshes
    setError(null);
  }, [refreshKey]);
  
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
        onError={(message) => setError(message)}
      />
    </div>
  );
};

export default HistoryTab;
