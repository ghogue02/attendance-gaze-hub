
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Builder, AttendanceRecord, BuilderStatus } from './types';
import { toast } from 'sonner';
import DeleteAttendanceConfirmation from './attendance/DeleteAttendanceConfirmation';
import AttendanceHistoryContent from './attendance/AttendanceHistoryContent';
import { MINIMUM_DATE } from './attendance/attendanceValidation';

interface AttendanceHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  builder: Builder;
}

const AttendanceHistoryDialog = ({ isOpen, onClose, builder }: AttendanceHistoryDialogProps) => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<BuilderStatus>('present');
  const [editExcuseReason, setEditExcuseReason] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAttendanceHistory();
    } else {
      // Clear state when closing the dialog
      setEditingRecord(null);
      setRecordToDelete(null);
      setDeleteDialogOpen(false);
    }
  }, [isOpen, builder.id]);

  const fetchAttendanceHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', builder.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching builder attendance history:', error);
        toast.error('Failed to load attendance history');
        return;
      }

      // Filter out dates before minimum date
      const filteredData = data.filter(record => {
        const date = new Date(record.date);
        return date >= MINIMUM_DATE;
      });

      const history: AttendanceRecord[] = filteredData.map(record => {
        // Convert string status to BuilderStatus type
        let status: BuilderStatus = record.status as BuilderStatus;
        
        // Handle excused absences
        if (record.excuse_reason && record.status === 'absent') {
          status = 'excused';
        }

        return {
          id: record.id,
          date: record.date,
          status,
          timeRecorded: record.time_recorded 
            ? new Date(record.time_recorded).toLocaleTimeString() 
            : undefined,
          excuseReason: record.excuse_reason,
          notes: record.notes
        };
      });

      setAttendanceHistory(history);
    } catch (error) {
      console.error('Error in fetchAttendanceHistory:', error);
      toast.error('Error loading attendance history');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (record: AttendanceRecord) => {
    console.log('Starting to edit record:', record);
    setEditingRecord(record);
    setEditStatus(record.status);
    setEditExcuseReason(record.excuseReason || '');
    setEditNotes(record.notes || '');
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setEditStatus('present');
    setEditExcuseReason('');
    setEditNotes('');
  };

  const saveAttendanceChanges = async () => {
    if (!editingRecord) return;
    
    setIsLoading(true);
    try {
      // For database, we need to handle 'excused' status by setting status to 'absent' with excuse_reason
      const dbStatus = editStatus === 'excused' ? 'absent' : editStatus;
      const dbExcuseReason = editStatus === 'excused' ? editExcuseReason : null;
      
      const { error } = await supabase
        .from('attendance')
        .update({
          status: dbStatus,
          excuse_reason: dbExcuseReason,
          notes: editNotes,
          time_recorded: new Date().toISOString()
        })
        .eq('id', editingRecord.id);

      if (error) {
        console.error('Error updating attendance record:', error);
        toast.error('Failed to update attendance');
        return;
      }
      
      toast.success('Attendance record updated');
      
      // Update local state
      setAttendanceHistory(prev => 
        prev.map(record => 
          record.id === editingRecord.id
            ? {
                ...record,
                status: editStatus,
                excuseReason: editStatus === 'excused' ? editExcuseReason : undefined,
                notes: editNotes,
                timeRecorded: new Date().toLocaleTimeString()
              }
            : record
        )
      );
      
      cancelEditing();
    } catch (error) {
      console.error('Error in saveAttendanceChanges:', error);
      toast.error('Error updating attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const addNewAttendanceRecord = async (
    date: string, 
    status: BuilderStatus, 
    excuseReason: string, 
    notes: string
  ) => {
    setIsLoading(true);
    try {
      // For database, we need to handle 'excused' status
      const dbStatus = status === 'excused' ? 'absent' : status;
      const dbExcuseReason = status === 'excused' ? excuseReason : null;
      
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          student_id: builder.id,
          date: date,
          status: dbStatus,
          excuse_reason: dbExcuseReason,
          notes: notes,
          time_recorded: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error adding attendance record:', error);
        toast.error('Failed to add attendance record');
        return;
      }
      
      toast.success('Attendance record added');
      
      // Create new record for the UI
      const newRecord: AttendanceRecord = {
        id: data.id,
        date: date,
        status: status,
        timeRecorded: new Date().toLocaleTimeString(),
        excuseReason: status === 'excused' ? excuseReason : undefined,
        notes: notes || undefined
      };
      
      // Update local state - insert new record and sort by date
      setAttendanceHistory(prev => {
        return [...prev, newRecord].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });
    } catch (error) {
      console.error('Error in addNewAttendanceRecord:', error);
      toast.error('Error adding attendance record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = (record: AttendanceRecord) => {
    // Close other forms if they're open
    setEditingRecord(null);
    
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', recordToDelete.id);

      if (error) {
        console.error('Error deleting attendance record:', error);
        toast.error('Failed to delete attendance record');
        return;
      }
      
      toast.success('Attendance record deleted');
      
      // Update local state
      setAttendanceHistory(prev => 
        prev.filter(record => record.id !== recordToDelete.id)
      );
      
      // Close the delete dialog
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Error in deleteAttendanceRecord:', error);
      toast.error('Error deleting attendance record');
    } finally {
      setIsLoading(false);
    }
  };

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
            onDeleteRecord={handleDeleteRecord}
            onAddNewDate={addNewAttendanceRecord}
            editingRecord={editingRecord}
            editStatus={editStatus}
            editExcuseReason={editExcuseReason}
            editNotes={editNotes}
            onStatusChange={setEditStatus}
            onExcuseReasonChange={setEditExcuseReason}
            onNotesChange={setEditNotes}
            onSaveChanges={saveAttendanceChanges}
            onCancelEdit={cancelEditing}
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
