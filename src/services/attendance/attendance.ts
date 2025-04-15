
import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/builder/types';

// Mark attendance for a specific student
export const markAttendance = async (
  studentId: string,
  status: BuilderStatus,
  date: string,
  notes?: string
): Promise<boolean> => {
  try {
    // Check if attendance record already exists for this student on this date
    const { data: existingRecord, error: fetchError } = await supabase
      .from('attendance')
      .select('id, status, notes')
      .eq('student_id', studentId)
      .eq('date', date)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      // Real error, not just "no rows returned"
      console.error('Error checking existing attendance:', fetchError);
      return false;
    }
    
    const now = new Date().toISOString();
    
    // Clear automated "marked absent" notes when marking student as present
    const finalNotes = (status === 'present' || status === 'late' || status === 'excused') && 
                       existingRecord?.notes?.toLowerCase().includes('automatically marked') 
                         ? null 
                         : notes || existingRecord?.notes || null;
    
    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('attendance')
        .update({ 
          status, 
          time_recorded: now,
          notes: finalNotes
        })
        .eq('id', existingRecord.id);
        
      if (updateError) {
        console.error('Error updating attendance:', updateError);
        return false;
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          student_id: studentId,
          date,
          status,
          time_recorded: now,
          notes: finalNotes
        });
        
      if (insertError) {
        console.error('Error inserting attendance:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error marking attendance:', error);
    return false;
  }
};

// Export other attendance-related functions
export { subscribeToAttendanceChanges } from './realtime';
export { deleteAttendanceRecordsByDate } from '@/services/attendanceHistoryService';
