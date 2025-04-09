
import { memo, useState, useCallback, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import AttendanceErrorDisplay from './AttendanceErrorDisplay';
import { clearAutomatedNotesForPresentStudents } from '@/services/attendance';
import { format, subMonths } from 'date-fns';
import { AttendanceRecord } from './AttendanceTypes';

interface AttendanceHistoryProps {
  builders: Builder[];
  onError: (message: string) => void;
}

const AttendanceHistory = memo(({ builders, onError }: AttendanceHistoryProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  
  // State for the attendance history dialog
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  // Define date range boundaries for the calendar
  const toDate = new Date();
  const fromDate = subMonths(toDate, 6); // Allow selecting dates from 6 months ago
  
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
  
  // Check if there are active filters
  const hasActiveFilters = Boolean(dateFilter || statusFilter !== 'all');

  // Handle showing builder history dialog
  const handleShowBuilderHistory = useCallback((record: AttendanceRecord) => {
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
    setSelectedBuilder(null); // Make sure to clear the selected builder
  }, []);
  
  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    refreshData();
  }, [refreshData]);
  
  // Handle error
  const localHandleError = useCallback((message: string) => {
    setError(message);
    onError(message);
  }, [onError]);
  
  // Handle clear automated notes
  const handleClearAutomatedNotes = useCallback(async () => {
    setIsClearing(true);
    try {
      const result = await clearAutomatedNotesForPresentStudents();
      if (result > 0) {
        toast.success(`Cleared automated notes for ${result} students`);
        refreshData();
      } else {
        toast.info('No automated notes needed to be cleared');
      }
    } catch (e) {
      console.error('Error clearing automated notes:', e);
      localHandleError('Failed to clear automated notes');
    } finally {
      setIsClearing(false);
    }
  }, [refreshData, localHandleError]);
  
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
      
      <div>
        {isLoading ? (
          <AttendanceLoadingState />
        ) : attendanceRecords.length === 0 ? (
          <AttendanceEmptyState 
            dateFiltered={!!dateFilter}
            statusFiltered={statusFilter !== 'all'}
          />
        ) : (
          <div className="space-y-4">
            <AttendanceFilters 
              dateFilter={dateFilter}
              statusFilter={statusFilter}
              setDateFilter={setDateFilter}
              setStatusFilter={setStatusFilter}
              date={date}
              setDate={setDate}
              calendarOpen={calendarOpen}
              setCalendarOpen={setCalendarOpen}
              clearDateFilter={clearDateFilter}
              clearStatusFilter={clearStatusFilter}
              clearAllFilters={clearAllFilters}
              fromDate={fromDate}
              toDate={toDate}
              hasActiveFilters={hasActiveFilters}
            />
            
            <AttendanceTable 
              attendanceRecords={attendanceRecords}
              formatDate={formatDate}
              onDeleteRecord={handleDeleteRecord}
              onNavigateToBuilder={handleShowBuilderHistory}
            />
            
            <AttendanceCopyOptions 
              attendanceRecords={attendanceRecords}
              formatDate={formatDate}
              dateFilter={dateFilter}
            />
          </div>
        )}
      </div>
      
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
