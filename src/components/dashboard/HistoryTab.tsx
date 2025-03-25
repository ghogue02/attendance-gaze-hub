
import { useState } from 'react';
import { Builder } from '@/components/builder/types';
import AttendanceHistory from './AttendanceHistory';
import AttendanceErrorDisplay from './AttendanceErrorDisplay';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ImportAttendanceButton from './ImportAttendanceButton';

interface HistoryTabProps {
  builders: Builder[];
}

const HistoryTab = ({ builders }: HistoryTabProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRetry = () => {
    setError(null);
    // Additional retry logic if needed
  };
  
  const handleImportComplete = () => {
    // Refresh the attendance history when import completes
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Attendance History</h2>
        <ImportAttendanceButton onComplete={handleImportComplete} />
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
      
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin mr-2">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
          </div>
          <span>Loading attendance history...</span>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
