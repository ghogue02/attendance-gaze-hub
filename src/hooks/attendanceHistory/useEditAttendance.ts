
import { useState, useCallback } from 'react';
import { BuilderStatus, AttendanceRecord } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EditAttendanceProps {
  setAttendanceHistory: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

export const useEditAttendance = ({ setAttendanceHistory }: EditAttendanceProps) => {
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editingDate, setEditingDate] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<BuilderStatus>('present');
  const [editExcuseReason, setEditExcuseReason] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const startEditing = useCallback((record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditStatus(record.status);
    setEditExcuseReason(record.excuseReason || '');
    setEditNotes(record.notes || '');
    setEditingDate(null);
  }, []);
  
  const startEditingDate = useCallback((record: AttendanceRecord) => {
    setEditingDate(record);
    setEditingRecord(null);
  }, []);
  
  const cancelEditing = useCallback(() => {
    setEditingRecord(null);
  }, []);
  
  const cancelEditingDate = useCallback(() => {
    setEditingDate(null);
  }, []);
  
  const saveAttendanceChanges = useCallback(async () => {
    if (!editingRecord) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          status: editStatus,
          excuse_reason: editExcuseReason || null,
          notes: editNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRecord.id);
      
      if (error) {
        console.error('Error updating attendance:', error);
        toast.error('Failed to save changes');
        return;
      }
      
      // Update local state
      setAttendanceHistory(prev => prev.map(record => 
        record.id === editingRecord.id
          ? { ...record, status: editStatus, excuseReason: editExcuseReason, notes: editNotes }
          : record
      ));
      
      setEditingRecord(null);
      toast.success('Attendance updated successfully');
    } catch (err) {
      console.error('Unexpected error updating attendance:', err);
      toast.error('An unexpected error occurred while saving changes');
    } finally {
      setIsLoading(false);
    }
  }, [editingRecord, editStatus, editExcuseReason, editNotes, setAttendanceHistory]);
  
  return {
    editingRecord,
    editingDate,
    editStatus,
    editExcuseReason,
    editNotes,
    isLoading,
    setEditStatus,
    setEditExcuseReason,
    setEditNotes,
    startEditing,
    startEditingDate,
    cancelEditing,
    cancelEditingDate,
    saveAttendanceChanges
  };
};
