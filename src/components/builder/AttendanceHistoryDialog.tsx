
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Builder, AttendanceRecord } from './types';
import { useOptimizedAttendanceQueries } from '@/hooks/useOptimizedAttendanceQueries';
import AttendanceHistoryTable from './AttendanceHistoryTable';
import AttendanceStats from './attendance/AttendanceStats';
import AddNewDateForm from './attendance/AddNewDateForm';
import EditAttendanceDateForm from './attendance/EditAttendanceDateForm';
import DeleteAttendanceConfirmation from './attendance/DeleteAttendanceConfirmation';

interface AttendanceHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  builder: Builder;
}

const AttendanceHistoryDialog = ({ isOpen, onClose, builder }: AttendanceHistoryDialogProps) => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);
  
  const { fetchAttendanceHistory } = useOptimizedAttendanceQueries();

  useEffect(() => {
    if (isOpen && builder.id) {
      loadAttendanceHistory();
    }
  }, [isOpen, builder.id]);

  const loadAttendanceHistory = async () => {
    try {
      setIsLoading(true);
      const history = await fetchAttendanceHistory(builder.id);
      setAttendanceHistory(history);
    } catch (error) {
      console.error('Error loading attendance history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsAddingNew(false);
    setEditingRecord(null);
    setDeletingRecord(null);
    onClose();
  };

  const handleRecordAdded = () => {
    setIsAddingNew(false);
    loadAttendanceHistory();
  };

  const handleRecordUpdated = () => {
    setEditingRecord(null);
    loadAttendanceHistory();
  };

  const handleRecordDeleted = () => {
    setDeletingRecord(null);
    loadAttendanceHistory();
  };

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
              
              <AttendanceHistoryTable
                attendanceHistory={attendanceHistory}
                isLoading={isLoading}
                onEdit={setEditingRecord}
                onDelete={setDeletingRecord}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AddNewDateForm
        isOpen={isAddingNew}
        onClose={() => setIsAddingNew(false)}
        builderId={builder.id}
        onSuccess={handleRecordAdded}
      />

      {editingRecord && (
        <EditAttendanceDateForm
          isOpen={true}
          onClose={() => setEditingRecord(null)}
          record={editingRecord}
          onSuccess={handleRecordUpdated}
        />
      )}

      {deletingRecord && (
        <DeleteAttendanceConfirmation
          isOpen={true}
          onClose={() => setDeletingRecord(null)}
          record={deletingRecord}
          onSuccess={handleRecordDeleted}
        />
      )}
    </>
  );
};

export default AttendanceHistoryDialog;
