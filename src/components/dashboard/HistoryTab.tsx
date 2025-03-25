
import { useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import AttendanceHistory from './AttendanceHistory';
import AttendanceErrorDisplay from './AttendanceErrorDisplay';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ImportAttendanceButton from './ImportAttendanceButton';
import { toast } from 'sonner';

interface HistoryTabProps {
  builders: Builder[];
}

const HistoryTab = ({ builders }: HistoryTabProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRetry = () => {
    setError(null);
    setRefreshKey(prev => prev + 1);
  };
  
  const handleImportComplete = () => {
    // Refresh the attendance history when import completes
    setRefreshKey(prev => prev + 1);
    toast.success('Attendance history refreshed');
  };

  useEffect(() => {
    // Clear any previous errors when component mounts or refreshes
    setError(null);
  }, [refreshKey]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Attendance History</h2>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>
          <ImportAttendanceButton onComplete={handleImportComplete} />
        </div>
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
