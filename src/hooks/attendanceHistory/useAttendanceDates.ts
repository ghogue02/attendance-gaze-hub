
import { useState, useCallback } from 'react';
import { Builder } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAttendanceDatesProps {
  builder: Builder;
  loadAttendanceHistory: () => Promise<void>;
}

export const useAttendanceDates = ({ builder, loadAttendanceHistory }: UseAttendanceDatesProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
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
      
      toast.success('Date updated successfully');
    } catch (err) {
      console.error('Unexpected error updating date:', err);
      toast.error('An unexpected error occurred while updating date');
    } finally {
      setIsLoading(false);
    }
  }, [builder.id, loadAttendanceHistory]);
  
  const addNewAttendanceRecord = useCallback(async (
    date: string,
    status: any,
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
  
  return {
    isLoading,
    saveAttendanceDateChange,
    addNewAttendanceRecord
  };
};
