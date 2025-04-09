
import { AttendanceRecord } from './AttendanceTypes';
import { Builder } from '@/components/builder/types';
import AttendanceHistoryDialog from '@/components/builder/AttendanceHistoryDialog';
import DeleteAttendanceDialog from './DeleteAttendanceDialog';

interface AttendanceHistoryDialogsProps {
  selectedBuilder: Builder | null;
  historyDialogOpen: boolean;
  onCloseHistoryDialog: () => void;
  deleteDialogOpen: boolean;
  isLoading: boolean;
  onCloseDeleteDialog: () => void;
  onConfirmDelete: () => Promise<void>;
}

const AttendanceHistoryDialogs = ({
  selectedBuilder,
  historyDialogOpen,
  onCloseHistoryDialog,
  deleteDialogOpen,
  isLoading,
  onCloseDeleteDialog,
  onConfirmDelete
}: AttendanceHistoryDialogsProps) => {
  return (
    <>
      {selectedBuilder && (
        <AttendanceHistoryDialog 
          isOpen={historyDialogOpen}
          onClose={onCloseHistoryDialog}
          builder={selectedBuilder}
        />
      )}
      
      <DeleteAttendanceDialog
        isOpen={deleteDialogOpen}
        isLoading={isLoading}
        onClose={onCloseDeleteDialog}
        onConfirm={onConfirmDelete}
      />
    </>
  );
};

export default AttendanceHistoryDialogs;
