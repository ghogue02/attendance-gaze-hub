
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Marks attendance for a student
 * @param studentId The ID of the student
 * @param status The attendance status (present, absent, late)
 * @param excuseReason Optional reason for excused absence
 * @returns The result of the operation
 */
export const markAttendance = async (
  studentId: string,
  status: string = 'present',
  excuseReason?: string
): Promise<boolean> => {
  try {
    console.log(`Marking attendance for student ID: ${studentId} with status: ${status}`);
    
    if (!studentId) {
      console.error('Error: Student ID is required');
      toast.error('Failed to mark attendance: Student ID is missing');
      return false;
    }
    
    // Check if attendance has already been recorded for today
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Checking for existing attendance on date: ${today}`);
    
    const { data: existingAttendance, error: checkError } = await supabase
      .from('attendance')
      .select('id, status, excuse_reason')
      .eq('student_id', studentId)
      .eq('date', today)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking existing attendance:', checkError);
      toast.error('Failed to check attendance records');
      return false;
    }
    
    // Create a proper ISO timestamp for the current time
    const now = new Date();
    const timestamp = now.toISOString();
    
    // If attendance already exists, update it
    if (existingAttendance) {
      console.log(`Updating existing attendance record (ID: ${existingAttendance.id}) from status: ${existingAttendance.status} to: ${status}`);
      
      const updateData: any = {
        status,
        time_recorded: timestamp
      };
      
      // Only set excuse_reason if it's provided or if status is 'excused'
      if (excuseReason !== undefined) {
        updateData.excuse_reason = excuseReason;
      } else if (status !== 'excused' && existingAttendance.excuse_reason) {
        // Clear excuse reason if changing away from excused status
        updateData.excuse_reason = null;
      }
      
      const { error: updateError } = await supabase
        .from('attendance')
        .update(updateData)
        .eq('id', existingAttendance.id);
        
      if (updateError) {
        console.error('Error updating attendance:', updateError);
        toast.error('Failed to update attendance record');
        return false;
      }
      
      console.log('Attendance record updated successfully with timestamp:', timestamp);
      
      // Force a publish to other clients that are subscribed
      try {
        // This is just an extra update to ensure the realtime subscribers get notified
        await supabase
          .from('attendance')
          .update({ updated_at: timestamp })
          .eq('id', existingAttendance.id);
      } catch (e) {
        // We can ignore this error as it's just a helper update
        console.log('Helper update completed');
      }
      
      return true;
    }
    
    // Otherwise, insert new attendance record
    console.log(`Creating new attendance record for student ${studentId} with status: ${status}`);
    
    const newRecord: any = {
      student_id: studentId,
      status,
      date: today,
      time_recorded: timestamp
    };
    
    // Add excuse reason if provided for a new record
    if (excuseReason !== undefined) {
      newRecord.excuse_reason = excuseReason;
    }
    
    const { data: insertedRecord, error: insertError } = await supabase
      .from('attendance')
      .insert(newRecord)
      .select('id');
      
    if (insertError) {
      console.error('Error inserting attendance:', insertError);
      toast.error('Failed to create attendance record');
      return false;
    }
    
    console.log('Attendance record created successfully with ID:', insertedRecord?.[0]?.id);
    return true;
  } catch (error) {
    console.error('Error in markAttendance:', error);
    toast.error('An unexpected error occurred while marking attendance');
    return false;
  }
};
