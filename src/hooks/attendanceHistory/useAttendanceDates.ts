
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
      // Validate excused status has a reason
      if (status === 'excused' && !excuseReason?.trim()) {
        toast.error('Excuse reason is required for excused absences');
        return;
      }
      
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
      
      // Convert status for database storage - 'excused' becomes 'absent' with excuse_reason
      const dbStatus = status === 'excused' ? 'absent' : status;
      const dbExcuseReason = status === 'excused' ? excuseReason : null;
      
      console.log(`[addNewAttendanceRecord] Adding record for ${builder.name} on ${date} with status ${status} -> ${dbStatus}`);
      
      // Insert new record with proper status conversion
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: builder.id,
          date,
          status: dbStatus,
          excuse_reason: dbExcuseReason,
          notes: notes || null,
          time_recorded: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error adding attendance record:', error);
        toast.error(`Failed to add new attendance record: ${error.message}`);
        return;
      }
      
      console.log(`[addNewAttendanceRecord] Successfully added ${status} record for ${builder.name}`);
      
      // Reload attendance history
      await loadAttendanceHistory();
      toast.success(`New ${status} record added successfully`);
    } catch (err) {
      console.error('Unexpected error adding attendance record:', err);
      toast.error('An unexpected error occurred while adding record');
    } finally {
      setIsLoading(false);
    }
  }, [builder.id, builder.name, loadAttendanceHistory]);
  
  return {
    isLoading,
    saveAttendanceDateChange,
    addNewAttendanceRecord
  };
};
