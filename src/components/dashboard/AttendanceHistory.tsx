
import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import { useAttendanceHistory } from '@/hooks/useAttendanceHistory';
import AttendanceLoadingState from './AttendanceLoadingState';
import AttendanceEmptyState from './AttendanceEmptyState';
import AttendanceTable from './AttendanceTable';
import DeleteAttendanceDialog from './DeleteAttendanceDialog';
import AttendanceFilters from './AttendanceFilters';
import AttendanceCopyOptions from './AttendanceCopyOptions';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AttendanceHistoryDialog from '@/components/builder/AttendanceHistoryDialog';

interface AttendanceHistoryProps {
  builders: Builder[];
  onError: (message: string) => void;
}

const AttendanceHistory = memo(({ builders, onError }: AttendanceHistoryProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const navigate = useNavigate();
  
  // State for the attendance history dialog
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  const {
    attendanceRecords,
    isLoading,
    deleteDialogOpen,
    recordToDelete,
    dateFilter,
    statusFilter,
    setDateFilter,
    setStatusFilter,
    formatDate,
    handleDeleteRecord,
    confirmDelete,
    closeDeleteDialog,
    refreshData
  } = useAttendanceHistory(onError);
  
  // Clear date filter
  const clearDateFilter = useCallback(() => {
    setDate(undefined);
    setDateFilter(null);
  }, [setDateFilter]);
  
  // Clear status filter
  const clearStatusFilter = useCallback(() => {
    setStatusFilter('all');
  }, [setStatusFilter]);
  
  // Clear all filters
  const clearAllFilters = useCallback(() => {
    clearDateFilter();
    clearStatusFilter();
  }, [clearDateFilter, clearStatusFilter]);

  // Handle showing builder history dialog
  const handleShowBuilderHistory = useCallback((record: any) => {
    // Find the builder in our list
    const builder = builders.find(b => b.id === record.studentId);
    
    if (builder) {
      setSelectedBuilder(builder);
      setHistoryDialogOpen(true);
    } else {
      toast.error(`Could not find builder with ID ${record.studentId}`);
    }
  }, [builders]);
  
  // Close history dialog
  const handleCloseHistoryDialog = useCallback(() => {
    setHistoryDialogOpen(false);
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
      
      {/* Add attendance history dialog */}
      {selectedBuilder && (
        <AttendanceHistoryDialog 
          isOpen={historyDialogOpen}
          onClose={handleCloseHistoryDialog}
          builder={selectedBuilder}
        />
      )}
      
      <DeleteAttendanceDialog
        isOpen={deleteDialogOpen}
        isLoading={isLoading}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
      />
    </div>
  );
});

AttendanceHistory.displayName = 'AttendanceHistory';

export default AttendanceHistory;
