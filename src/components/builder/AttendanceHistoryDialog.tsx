
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Builder, AttendanceRecord } from './types';
import { useOptimizedAttendanceQueries } from '@/hooks/useOptimizedAttendanceQueries';
import AttendanceHistoryTable from './AttendanceHistoryTable';
import AttendanceStats from './attendance/AttendanceStats';
import AddNewDateForm from './attendance/AddNewDateForm';
import EditAttendanceDateForm from './attendance/EditAttendanceDateForm';
import DeleteAttendanceConfirmation from './attendance/DeleteAttendanceConfirmation';
import { useFetchAttendanceHistory } from '@/hooks/attendanceHistory/useFetchAttendanceHistory';
import { useEditAttendance } from '@/hooks/attendanceHistory/useEditAttendance';
import { useDeleteAttendance } from '@/hooks/attendanceHistory/useDeleteAttendance';
import { useAttendanceDates } from '@/hooks/attendanceHistory/useAttendanceDates';

interface AttendanceHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  builder: Builder;
}

const AttendanceHistoryDialog = ({ isOpen, onClose, builder }: AttendanceHistoryDialogProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Use the custom hooks
  const { attendanceHistory, isLoading, setAttendanceHistory, loadAttendanceHistory } = useFetchAttendanceHistory(builder);
  const { 
    editingRecord, 
    editingDate, 
    startEditing, 
    startEditingDate, 
    cancelEditing, 
    cancelEditingDate,
    saveAttendanceChanges,
    editStatus,
    editExcuseReason,
    editNotes,
    setEditStatus,
    setEditExcuseReason,
    setEditNotes,
    isLoading: editLoading
  } = useEditAttendance({ setAttendanceHistory });
  
  const {
    deleteDialogOpen,
    recordToDelete,
    isLoading: deleteLoading,
    setDeleteDialogOpen,
    handleDeleteRecord,
    confirmDelete
  } = useDeleteAttendance({ setAttendanceHistory });
  
  const {
    isLoading: dateLoading,
    saveAttendanceDateChange,
    addNewAttendanceRecord
  } = useAttendanceDates({ builder, loadAttendanceHistory });

  useEffect(() => {
    if (isOpen && builder.id) {
      loadAttendanceHistory();
    }
  }, [isOpen, builder.id, loadAttendanceHistory]);

  const handleClose = () => {
    setIsAddingNew(false);
    cancelEditing();
    cancelEditingDate();
    setDeleteDialogOpen(false);
    onClose();
  };

  const handleRecordAdded = () => {
    setIsAddingNew(false);
  };

  const handleRecordUpdated = () => {
    cancelEditingDate();
  };

  const handleRecordDeleted = () => {
    setDeleteDialogOpen(false);
  };

  // Get existing dates for validation
  const existingDates = attendanceHistory.map(record => record.date);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Attendance History - {builder.name}</span>
              <Button
                size="sm"
                onClick={() => setIsAddingNew(true)}
                className="ml-auto"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Record
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              <AttendanceStats 
                attendanceHistory={attendanceHistory} 
                cohort={builder.cohort}
              />
              
              {isAddingNew && (
                <AddNewDateForm
                  onCancel={() => setIsAddingNew(false)}
                  onSave={addNewAttendanceRecord}
                  isLoading={dateLoading}
                  existingDates={existingDates}
                />
              )}
              
              <AttendanceHistoryTable
                attendanceHistory={attendanceHistory}
                isLoading={isLoading}
                onEditRecord={startEditing}
                onEditDate={startEditingDate}
                onDeleteRecord={handleDeleteRecord}
              />
              
              {editingDate && (
                <EditAttendanceDateForm
                  currentDate={editingDate.date}
                  existingDates={existingDates}
                  onSave={(newDate) => saveAttendanceDateChange(editingDate.id, newDate)}
                  onCancel={cancelEditingDate}
                  isLoading={dateLoading}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <DeleteAttendanceConfirmation
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isLoading={deleteLoading}
      />
    </>
  );
};

export default AttendanceHistoryDialog;
