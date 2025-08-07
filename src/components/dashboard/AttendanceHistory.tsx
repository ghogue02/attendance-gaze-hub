
import { useState, useCallback, memo } from 'react';
import { Builder } from '@/components/builder/types';
import { useAttendanceHistory } from '@/hooks/useAttendanceHistory';
import { subMonths } from 'date-fns';
import { toast } from 'sonner';
import { AttendanceRecord } from './AttendanceTypes';
import AttendanceErrorDisplay from './AttendanceErrorDisplay';
import AttendanceHistoryHeader from './AttendanceHistoryHeader';
import AttendanceHistoryContent from './AttendanceHistoryContent';
import AttendanceHistoryDialogs from './AttendanceHistoryDialogs';
import { useAttendanceClearNotes } from './useAttendanceClearNotes';
import { CohortName } from '@/types/cohort';

interface AttendanceHistoryProps {
  builders: Builder[];
  onError: (message: string) => void;
  selectedCohort: CohortName;
}

const AttendanceHistory = memo(({ builders, onError, selectedCohort }: AttendanceHistoryProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  const toDate = new Date();
  const fromDate = subMonths(toDate, 6);
  
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
  } = useAttendanceHistory(onError, selectedCohort || 'All Cohorts');

  const { isClearing, handleClearAutomatedNotes } = useAttendanceClearNotes(onError, refreshData);
  
  const clearDateFilter = useCallback(() => {
    setDate(undefined);
    setDateFilter(null);
  }, [setDateFilter]);
  
  const clearStatusFilter = useCallback(() => {
    setStatusFilter('all');
  }, [setStatusFilter]);
  
  const clearAllFilters = useCallback(() => {
    clearDateFilter();
    clearStatusFilter();
  }, [clearDateFilter, clearStatusFilter]);
  
  const hasActiveFilters = Boolean(dateFilter || statusFilter !== 'all');
  
  const handleShowBuilderHistory = useCallback((record: AttendanceRecord) => {
    const builder = builders.find(b => b.id === record.studentId);
    
    if (builder) {
      setSelectedBuilder(builder);
      setHistoryDialogOpen(true);
    } else {
      toast.error(`Could not find builder with ID ${record.studentId}`);
    }
  }, [builders]);
  
  const handleCloseHistoryDialog = useCallback(() => {
    setHistoryDialogOpen(false);
    setSelectedBuilder(null);
  }, []);
  
  const handleRetry = useCallback(() => {
    setError(null);
    refreshData();
  }, [refreshData]);
  
  const localHandleError = useCallback((message: string) => {
    setError(message);
    onError(message);
  }, [onError]);

  return (
    <div className="space-y-6">
      <AttendanceHistoryHeader 
        onClearAutomatedNotes={handleClearAutomatedNotes}
        isClearing={isClearing}
      />
      
      {error && (
        <AttendanceErrorDisplay 
          message={error}
          onRetry={handleRetry}
        />
      )}
      
      <AttendanceHistoryContent 
        attendanceRecords={attendanceRecords}
        isLoading={isLoading}
        dateFilter={dateFilter}
        statusFilter={statusFilter}
        setDateFilter={setDateFilter}
        setStatusFilter={setStatusFilter}
        date={date}
        setDate={setDate}
        calendarOpen={calendarOpen}
        setCalendarOpen={setCalendarOpen}
        fromDate={fromDate}
        toDate={toDate}
        formatDate={formatDate}
        onDeleteRecord={handleDeleteRecord}
        onNavigateToBuilder={handleShowBuilderHistory}
        hasActiveFilters={hasActiveFilters}
        clearDateFilter={clearDateFilter}
        clearStatusFilter={clearStatusFilter}
        clearAllFilters={clearAllFilters}
      />
      
      <AttendanceHistoryDialogs 
        selectedBuilder={selectedBuilder}
        historyDialogOpen={historyDialogOpen}
        onCloseHistoryDialog={handleCloseHistoryDialog}
        deleteDialogOpen={deleteDialogOpen}
        isLoading={isLoading}
        onCloseDeleteDialog={closeDeleteDialog}
        onConfirmDelete={confirmDelete}
      />
    </div>
  );
});

AttendanceHistory.displayName = 'AttendanceHistory';

export default AttendanceHistory;
