
import { supabase } from '@/integrations/supabase/client';
import { BuilderStatus } from '@/components/builder/types';
import { toast } from 'sonner';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { TIMEZONE } from '@/utils/date/dateUtils';
import { debugAttendanceLogging } from '@/utils/debugging/builderDebugUtils';

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
    // Use the provided date or default to today's date in Eastern timezone
    const now = new Date();
    const easternNow = toZonedTime(now, TIMEZONE);
    const targetDate = dateString || formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd');
    
    // Enhanced logging for problematic users
    const { data: studentData } = await supabase
      .from('students')
      .select('first_name, last_name, email')
      .eq('id', studentId)
      .single();
    
    const studentName = studentData ? `${studentData.first_name} ${studentData.last_name}` : 'Unknown';
    const isProblematicUser = studentName.includes('Mahkeddah') || studentName.includes('Cherice') || studentName.includes('Radhames');
    
    if (isProblematicUser || status === 'excused') {
      console.log(`[markAttendance] MANUAL ENTRY: Marking attendance for ${studentName} (ID: ${studentId}) on ${targetDate} with status ${status}`);
      if (excuseReason) {
        console.log(`[markAttendance] MANUAL ENTRY: Excuse reason: "${excuseReason}"`);
      }
      console.log(`[markAttendance] MANUAL ENTRY: Student email: ${studentData?.email}`);
      
      // Debug recent attendance
      await debugAttendanceLogging(studentId, studentName);
    }
    
    console.log(`[markAttendance] Setting attendance for student ${studentId} on date ${targetDate} with status ${status}`);
    console.log(`[markAttendance] Current time in Eastern: ${formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd HH:mm:ss z')}`);

    // For database storage, 'excused' status is stored as 'absent' with an excuse_reason
    const dbStatus = status === 'excused' ? 'absent' : status;
    const dbExcuseReason = status === 'excused' ? excuseReason : null;

    // Check if attendance record already exists for this date
    const { data: existingRecord, error: checkError } = await supabase
      .from('attendance')
      .select('id, status, notes, excuse_reason')
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
          (existingRecord.status === 'absent' || existingRecord.status === 'pending') && 
          notesToUpdate && 
          (notesToUpdate.includes('Automatically marked') || notesToUpdate.includes('automatically marked'))) {
        console.log('[markAttendance] Clearing automated absence note as student is now present/late');
        notesToUpdate = null;
      }
      
      // CRITICAL: For manual excused entries, add a special note to help identify them
      if (status === 'excused') {
        console.log(`[markAttendance] MANUAL EXCUSED ENTRY: Adding protection note for ${studentName}`);
        notesToUpdate = `Manual excused entry - ${excuseReason || 'No reason provided'}`;
      }
      
      // Update the existing record with timestamp in ISO format
      result = await supabase
        .from('attendance')
        .update({
          status: dbStatus,
          excuse_reason: dbExcuseReason,
          notes: notesToUpdate,
          time_recorded: now.toISOString() // Store in ISO format
        })
        .eq('id', existingRecord.id);
        
      if (isProblematicUser || status === 'excused') {
        console.log(`[markAttendance] MANUAL ENTRY: Updated existing record for ${studentName} with status ${status}`);
      }
    } else {
      // CRITICAL: For manual excused entries, add a special note to help identify them
      let initialNotes = null;
      if (status === 'excused') {
        console.log(`[markAttendance] MANUAL EXCUSED ENTRY: Creating new record with protection note for ${studentName}`);
        initialNotes = `Manual excused entry - ${excuseReason || 'No reason provided'}`;
      }
      
      // Create a new record with timestamp in ISO format
      result = await supabase
        .from('attendance')
        .insert({
          student_id: studentId,
          date: targetDate,
          status: dbStatus,
          excuse_reason: dbExcuseReason,
          notes: initialNotes,
          time_recorded: now.toISOString() // Store in ISO format
        });
        
      if (isProblematicUser || status === 'excused') {
        console.log(`[markAttendance] MANUAL ENTRY: Created new record for ${studentName} with status ${status}`);
      }
    }

    if (result.error) {
      console.error('Error saving attendance:', result.error);
      if (isProblematicUser || status === 'excused') {
        console.error(`[markAttendance] MANUAL ENTRY: Database error for ${studentName}:`, result.error);
        toast.error(`Failed to mark attendance for ${studentName}: ${result.error.message}`);
      }
      return false;
    }

    if (isProblematicUser || status === 'excused') {
      console.log(`[markAttendance] MANUAL ENTRY: Successfully marked ${studentName} as ${status}`);
      toast.success(`Successfully marked ${studentName} as ${status}`);
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in markAttendance:', error);
    return false;
  }
};

// Export the processHistoricalAttendance function from the correct module
export { processHistoricalAttendance } from '@/utils/attendance/processing/historicalProcessor';
