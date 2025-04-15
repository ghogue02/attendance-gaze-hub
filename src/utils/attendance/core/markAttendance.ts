
import { supabase } from '@/integrations/supabase/client';
import { BuilderStatus } from '@/components/builder/types';

/**
 * Mark attendance for a specific student
 * @param studentId - The ID of the student
 * @param status - The attendance status to set
 * @param excuseReason - Optional reason for an excused absence
 * @param dateString - Optional specific date in YYYY-MM-DD format, defaults to today
 * @returns boolean indicating success
 */
export const markAttendance = async (
  studentId: string,
  status: BuilderStatus,
  excuseReason?: string,
  dateString?: string
): Promise<boolean> => {
  if (!studentId) {
    console.error('Cannot mark attendance: No student ID provided');
    return false;
  }

  try {
    // Use the provided date or default to today's date in the local timezone
    const targetDate = dateString || new Date().toISOString().split('T')[0];
    console.log(`[markAttendance] Setting attendance for student ${studentId} on date ${targetDate} with status ${status}`);

    // For database storage, 'excused' status is stored as 'absent' with an excuse_reason
    const dbStatus = status === 'excused' ? 'absent' : status;
    const dbExcuseReason = status === 'excused' ? excuseReason : null;

    // Check if attendance record already exists for this date
    const { data: existingRecord, error: checkError } = await supabase
      .from('attendance')
      .select('id, status, notes')
      .eq('student_id', studentId)
      .eq('date', targetDate)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking for existing attendance record:', checkError);
      return false;
    }

    let result;
    
    if (existingRecord) {
      // Determine if we should clear automated notes
      let notesToUpdate = existingRecord.notes;
      
      // If changing from absent/pending to present/late, and the note contains "Automatically marked", clear it
      if ((status === 'present' || status === 'late') && 
          notesToUpdate && 
          (notesToUpdate.includes('Automatically marked') || notesToUpdate.includes('automatically marked'))) {
        console.log('Clearing automated absence note as student is now present/late');
        notesToUpdate = null;
      }
      
      // Update the existing record
      result = await supabase
        .from('attendance')
        .update({
          status: dbStatus,
          excuse_reason: dbExcuseReason,
          notes: notesToUpdate,
          time_recorded: new Date().toISOString()
        })
        .eq('id', existingRecord.id);
    } else {
      // Create a new record
      result = await supabase
        .from('attendance')
        .insert({
          student_id: studentId,
          date: targetDate,
          status: dbStatus,
          excuse_reason: dbExcuseReason,
          time_recorded: new Date().toISOString()
        });
    }

    if (result.error) {
      console.error('Error saving attendance:', result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in markAttendance:', error);
    return false;
  }
};
