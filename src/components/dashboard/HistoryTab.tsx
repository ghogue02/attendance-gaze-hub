
import { useState } from 'react';
import { Builder } from '@/components/builder/types';
import AttendanceHistory from './AttendanceHistory';
import AttendanceErrorDisplay from './AttendanceErrorDisplay';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface HistoryTabProps {
  builders: Builder[];
}

const HistoryTab = ({ builders }: HistoryTabProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRetry = () => {
    setError(null);
    // Additional retry logic if needed
  };
  
  return (
    <div className="space-y-6">
      {error && (
        <AttendanceErrorDisplay 
          message={error}
          onRetry={handleRetry}
        />
      )}
      
      <AttendanceHistory 
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
