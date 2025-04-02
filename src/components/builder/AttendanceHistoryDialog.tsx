
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Builder } from './types';
import DeleteAttendanceConfirmation from './attendance/DeleteAttendanceConfirmation';
import AttendanceHistoryContent from './attendance/AttendanceHistoryContent';
import { useAttendanceHistoryState } from '@/hooks/useAttendanceHistoryState';

interface AttendanceHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  builder: Builder;
}

const AttendanceHistoryDialog = ({ isOpen, onClose, builder }: AttendanceHistoryDialogProps) => {
  const {
    attendanceHistory,
    isLoading,
    editingRecord,
    editingDate,
    editStatus,
    editExcuseReason,
    editNotes,
    deleteDialogOpen,
    recordToDelete,
    startEditing,
    startEditingDate,
    cancelEditing,
    cancelEditingDate,
    saveAttendanceChanges,
    saveAttendanceDateChange,
    addNewAttendanceRecord,
    handleDeleteRecord,
    confirmDelete,
    setEditStatus,
    setEditExcuseReason,
    setEditNotes,
    setDeleteDialogOpen
  } = useAttendanceHistoryState({ builder, isOpen });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Attendance History for {builder.name}
            </DialogTitle>
          </DialogHeader>
          
          <AttendanceHistoryContent
            builder={builder}
            attendanceHistory={attendanceHistory}
            isLoading={isLoading}
            onEditRecord={startEditing}
            onEditDate={startEditingDate}
            onDeleteRecord={handleDeleteRecord}
            onAddNewDate={addNewAttendanceRecord}
            onSaveNewDate={saveAttendanceDateChange}
            editingRecord={editingRecord}
            editingDate={editingDate}
            editStatus={editStatus}
            editExcuseReason={editExcuseReason}
            editNotes={editNotes}
            onStatusChange={setEditStatus}
            onExcuseReasonChange={setEditExcuseReason}
            onNotesChange={setEditNotes}
            onSaveChanges={saveAttendanceChanges}
            onCancelEdit={cancelEditing}
            onCancelEditDate={cancelEditingDate}
          />
          
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteAttendanceConfirmation
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isLoading={isLoading}
      />
    </>
  );
};

export default AttendanceHistoryDialog;
