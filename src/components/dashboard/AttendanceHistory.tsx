
import { memo } from 'react';
import { Builder } from '@/components/builder/types';
import { useAttendanceHistory } from './useAttendanceHistory';
import AttendanceLoadingState from './AttendanceLoadingState';
import AttendanceEmptyState from './AttendanceEmptyState';
import AttendanceTable from './AttendanceTable';
import DeleteAttendanceDialog from './DeleteAttendanceDialog';

interface AttendanceHistoryProps {
  builders: Builder[];
  onError: (message: string) => void;
}

const AttendanceHistory = memo(({ builders, onError }: AttendanceHistoryProps) => {
  const {
    attendanceRecords,
    isLoading,
    deleteDialogOpen,
    formatDate,
    handleDeleteRecord,
    confirmDelete,
    closeDeleteDialog
  } = useAttendanceHistory(onError);
  
  if (isLoading) {
    return <AttendanceLoadingState />;
  }
  
  if (attendanceRecords.length === 0) {
    return <AttendanceEmptyState />;
  }
  
  return (
    <>
      <div className="space-y-4">
        <AttendanceTable 
          attendanceRecords={attendanceRecords}
          formatDate={formatDate}
          onDeleteRecord={handleDeleteRecord}
        />
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
