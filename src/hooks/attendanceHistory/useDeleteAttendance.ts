
import { useState, useCallback } from 'react';
import { AttendanceRecord } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseDeleteAttendanceProps {
  setAttendanceHistory: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

export const useDeleteAttendance = ({ setAttendanceHistory }: UseDeleteAttendanceProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
  }, [recordToDelete, setAttendanceHistory]);
  
  return {
    deleteDialogOpen,
    recordToDelete,
    isLoading,
    setDeleteDialogOpen,
    handleDeleteRecord,
    confirmDelete
  };
};
