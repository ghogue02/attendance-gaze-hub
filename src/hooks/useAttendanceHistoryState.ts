
import { useState, useEffect, useCallback } from 'react';
import { Builder, BuilderStatus, AttendanceRecord } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAttendanceHistoryProps {
  builder: Builder;
  isOpen: boolean;
}

export const useAttendanceHistoryState = ({ builder, isOpen }: UseAttendanceHistoryProps) => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editingDate, setEditingDate] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<BuilderStatus>('present');
  const [editExcuseReason, setEditExcuseReason] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  const loadAttendanceHistory = useCallback(async () => {
    if (!builder?.id) return;
    
    console.log(`Fetching attendance history for builder ${builder.id}`);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('id, date, status, time_recorded, notes, excuse_reason')
        .eq('student_id', builder.id)
        .order('date', { ascending: false });
        
      if (error) {
        console.error('Error fetching attendance history:', error);
        toast.error('Failed to fetch attendance history');
        return;
      }
      
      if (data) {
        // Filter out April 11, 2025 and April 4, 2025 records as they've been deleted from the database
        const filteredData = data.filter(record => 
          record.date !== '2025-04-11' && record.date !== '2025-04-04'
        );
        
        const formattedHistory = filteredData.map(record => ({
          id: record.id,
          date: record.date,
          status: record.status as BuilderStatus,
          timeRecorded: record.time_recorded ? new Date(record.time_recorded).toLocaleTimeString() : '',
          notes: record.notes || '',
          excuseReason: record.excuse_reason || ''
        }));
        
        setAttendanceHistory(formattedHistory);
      }
    } catch (err) {
      console.error('Unexpected error fetching attendance history:', err);
      toast.error('An unexpected error occurred while loading attendance history');
    } finally {
      setIsLoading(false);
    }
  }, [builder.id]);
  
  // Load history when the dialog opens
  useEffect(() => {
    if (isOpen) {
      loadAttendanceHistory();
    }
  }, [isOpen, loadAttendanceHistory]);
  
  // Start editing a record
  const startEditing = useCallback((record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditStatus(record.status);
    setEditExcuseReason(record.excuseReason || '');
    setEditNotes(record.notes || '');
    setEditingDate(null);
  }, []);
  
  // Start editing a record's date
  const startEditingDate = useCallback((record: AttendanceRecord) => {
    setEditingDate(record);
    setEditingRecord(null);
  }, []);
  
  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingRecord(null);
  }, []);
  
  // Cancel editing date
  const cancelEditingDate = useCallback(() => {
    setEditingDate(null);
  }, []);
  
  // Save attendance changes
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
  }, [editingRecord, editStatus, editExcuseReason, editNotes]);
  
  // Save date change
  const saveAttendanceDateChange = useCallback(async (recordId: string, newDate: string) => {
    setIsLoading(true);
    try {
      // First check if there's already a record for this date
      const { data: existingRecord, error: checkError } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', builder.id)
        .eq('date', newDate)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing record:', checkError);
        toast.error('Failed to check for existing record');
        return;
      }
      
      if (existingRecord) {
        toast.error(`An attendance record already exists for ${newDate}`);
        return;
      }
      
      // Update the date
      const { error } = await supabase
        .from('attendance')
        .update({
          date: newDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);
      
      if (error) {
        console.error('Error updating date:', error);
        toast.error('Failed to update date');
        return;
      }
      
      // Reload attendance history to get sorted records
      await loadAttendanceHistory();
      
      setEditingDate(null);
      toast.success('Date updated successfully');
    } catch (err) {
      console.error('Unexpected error updating date:', err);
      toast.error('An unexpected error occurred while updating date');
    } finally {
      setIsLoading(false);
    }
  }, [builder.id, loadAttendanceHistory]);
  
  // Add new attendance record
  const addNewAttendanceRecord = useCallback(async (
    date: string,
    status: BuilderStatus,
    excuseReason: string,
    notes: string
  ) => {
    setIsLoading(true);
    try {
      // First check if there's already a record for this date
      const { data: existingRecord, error: checkError } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', builder.id)
        .eq('date', date)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing record:', checkError);
        toast.error('Failed to check for existing record');
        return;
      }
      
      if (existingRecord) {
        toast.error(`An attendance record already exists for ${date}`);
        return;
      }
      
      // Insert new record
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: builder.id,
          date,
          status,
          excuse_reason: excuseReason || null,
          notes: notes || null
        });
      
      if (error) {
        console.error('Error adding attendance record:', error);
        toast.error('Failed to add new attendance record');
        return;
      }
      
      // Reload attendance history
      await loadAttendanceHistory();
      toast.success('New attendance record added');
    } catch (err) {
      console.error('Unexpected error adding attendance record:', err);
      toast.error('An unexpected error occurred while adding record');
    } finally {
      setIsLoading(false);
    }
  }, [builder.id, loadAttendanceHistory]);
  
  // Delete an attendance record
  const handleDeleteRecord = useCallback((record: AttendanceRecord) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  }, []);
  
  const confirmDelete = useCallback(async () => {
    if (!recordToDelete) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', recordToDelete.id);
      
      if (error) {
        console.error('Error deleting record:', error);
        toast.error('Failed to delete attendance record');
        return;
      }
      
      // Update local state
      setAttendanceHistory(prev => 
        prev.filter(record => record.id !== recordToDelete.id)
      );
      
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      toast.success('Attendance record deleted');
    } catch (err) {
      console.error('Unexpected error deleting record:', err);
      toast.error('An unexpected error occurred while deleting record');
    } finally {
      setIsLoading(false);
    }
  }, [recordToDelete]);
  
  return {
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
  };
};
