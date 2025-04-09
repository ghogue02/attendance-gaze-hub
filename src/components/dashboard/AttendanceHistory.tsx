
import { memo, useState, useCallback } from 'react';
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

interface AttendanceHistoryProps {
  builders: Builder[];
  onError: (message: string) => void;
}

const AttendanceHistory = memo(({ builders, onError }: AttendanceHistoryProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const navigate = useNavigate();
  
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

  // Navigate to the builder's card
  const handleNavigateToBuilder = useCallback((record: any) => {
    // Need to find the builder in our list
    const builder = builders.find(b => b.id === record.studentId);
    
    if (builder) {
      // Switch to the Builders tab and highlight the builder's card
      navigate('/dashboard', { 
        state: { 
          activeTab: 'builders', 
          highlightBuilderId: builder.id 
        } 
      });
      toast.info(`Navigating to ${builder.name}'s card...`);
    } else {
      toast.error(`Could not find builder with ID ${record.studentId}`);
    }
  }, [builders, navigate]);
  
  // Determine earliest valid date (March 15, 2025)
  const fromDate = new Date('2025-03-15');
  const toDate = new Date(); // Today
  
  // Check if any filters are active
  const hasActiveFilters = !!dateFilter || statusFilter !== 'all';
  
  if (isLoading) {
    return <AttendanceLoadingState />;
  }
  
  return (
    <>
      <div className="space-y-4">
        <AttendanceFilters 
          dateFilter={dateFilter}
          statusFilter={statusFilter}
          date={date}
          setDate={setDate}
          setDateFilter={setDateFilter}
          setStatusFilter={setStatusFilter}
          clearDateFilter={clearDateFilter}
          clearStatusFilter={clearStatusFilter}
          clearAllFilters={clearAllFilters}
          calendarOpen={calendarOpen}
          setCalendarOpen={setCalendarOpen}
          fromDate={fromDate}
          toDate={toDate}
          hasActiveFilters={hasActiveFilters}
        />
        
        <div className="flex justify-end">
          <AttendanceCopyOptions
            attendanceRecords={attendanceRecords}
            formatDate={formatDate}
            dateFilter={dateFilter}
          />
        </div>
        
        {attendanceRecords.length === 0 ? (
          <AttendanceEmptyState 
            dateFiltered={!!dateFilter} 
            statusFiltered={statusFilter !== 'all'}
          />
        ) : (
          <AttendanceTable 
            attendanceRecords={attendanceRecords}
            formatDate={formatDate}
            onDeleteRecord={handleDeleteRecord}
            onNavigateToBuilder={handleNavigateToBuilder}
          />
        )}
      </div>
      
      <DeleteAttendanceDialog
        isOpen={deleteDialogOpen}
        isLoading={isLoading}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
      />
    </>
  );
});

AttendanceHistory.displayName = 'AttendanceHistory';

export default AttendanceHistory;
