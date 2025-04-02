
import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Builder, AttendanceRecord, BuilderStatus } from './types';
import { toast } from 'sonner';
import DeleteAttendanceConfirmation from './attendance/DeleteAttendanceConfirmation';
import AttendanceHistoryContent from './attendance/AttendanceHistoryContent';
import { MINIMUM_DATE } from './attendance/attendanceValidation';
import { subscribeToAttendanceChanges } from '@/services/attendanceService';

interface AttendanceHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  builder: Builder;
}

const AttendanceHistoryDialog = ({ isOpen, onClose, builder }: AttendanceHistoryDialogProps) => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editingDate, setEditingDate] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<BuilderStatus>('present');
  const [editExcuseReason, setEditExcuseReason] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const isMounted = useRef(true);

  // Use callback to avoid recreating the function on each render
  const fetchAttendanceHistory = useCallback(async () => {
    if (!isMounted.current || !isOpen) return;
    
    console.log(`Fetching attendance history for builder ${builder.id}`);
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
  }, [builder.id, isOpen]);

  // Effect for initial load and subscription setup
  useEffect(() => {
    isMounted.current = true;
    
    if (isOpen) {
      fetchAttendanceHistory();
      
      // Subscribe to attendance changes from anywhere in the app
      const unsubscribe = subscribeToAttendanceChanges(() => {
        console.log('Attendance change detected, refreshing builder history');
        fetchAttendanceHistory();
      });
      
      return () => {
        unsubscribe();
      };
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [isOpen, fetchAttendanceHistory]);

  // Effect for cleanup when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Clear state when closing the dialog
      setEditingRecord(null);
      setEditingDate(null);
      setRecordToDelete(null);
      setDeleteDialogOpen(false);
    }
  }, [isOpen]);

  const startEditing = (record: AttendanceRecord) => {
    console.log('Starting to edit record:', record);
    // Cancel any date editing in progress
    setEditingDate(null);
    
    setEditingRecord(record);
    setEditStatus(record.status);
    setEditExcuseReason(record.excuseReason || '');
    setEditNotes(record.notes || '');
  };

  const startEditingDate = (record: AttendanceRecord) => {
    console.log('Starting to edit date for record:', record);
    // Cancel any status/note editing in progress
    setEditingRecord(null);
    
    setEditingDate(record);
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setEditStatus('present');
    setEditExcuseReason('');
    setEditNotes('');
  };

  const cancelEditingDate = () => {
    setEditingDate(null);
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

  const saveAttendanceDateChange = async (recordId: string, newDate: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          date: newDate,
          time_recorded: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) {
        console.error('Error updating attendance date:', error);
        toast.error('Failed to update attendance date');
        return;
      }
      
      toast.success('Attendance date updated');
      
      // Refresh the entire attendance history since we changed a date
      fetchAttendanceHistory();
      
      // Close the date editing form
      cancelEditingDate();
    } catch (error) {
      console.error('Error in saveAttendanceDateChange:', error);
      toast.error('Error updating attendance date');
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
      
      // Refresh the entire attendance history to ensure consistency
      fetchAttendanceHistory();
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
    setEditingDate(null);
    
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
