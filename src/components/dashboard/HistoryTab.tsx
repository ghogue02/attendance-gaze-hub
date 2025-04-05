
import { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import AttendanceHistory from './AttendanceHistory';
import AttendanceErrorDisplay from './AttendanceErrorDisplay';
import { subscribeToAttendanceChanges, clearAutomatedNotesForPresentStudents } from '@/services/attendanceService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface HistoryTabProps {
  builders: Builder[];
}

const HistoryTab = memo(({ builders }: HistoryTabProps) => {
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  
  const handleRetry = useCallback(() => {
    setError(null);
    setRefreshKey(prev => prev + 1);
  }, []);
  
  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);
  
  const handleClearAutomatedNotes = useCallback(async () => {
    setIsClearing(true);
    try {
      const clearedCount = await clearAutomatedNotesForPresentStudents();
      if (clearedCount > 0) {
        toast.success(`Cleared automated absence notes for ${clearedCount} students`);
        // Refresh the data
        setRefreshKey(prev => prev + 1);
      } else {
        toast.info('No automated notes needed to be cleared');
      }
    } catch (error) {
      console.error('Error clearing automated notes:', error);
      toast.error('Error clearing automated notes');
    } finally {
      setIsClearing(false);
    }
  }, []);
  
  // Set up a redundant subscription at the top level to ensure
  // the entire component tree refreshes when attendance changes
  useEffect(() => {
    const unsubscribe = subscribeToAttendanceChanges(() => {
      console.log('HistoryTab detected attendance change, forcing refresh');
      setRefreshKey(prev => prev + 1);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Memoize the builders array to prevent unnecessary re-renders
  const memoizedBuilders = useMemo(() => builders, [builders]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Attendance History</h2>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleClearAutomatedNotes} 
          disabled={isClearing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isClearing ? 'animate-spin' : ''}`} />
          Clear Automated Notes
        </Button>
      </div>
      
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
