
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Marks attendance for a student
 * @param studentId The ID of the student
 * @param status The attendance status (present, absent, late)
 * @returns The result of the operation
 */
export const markAttendance = async (
  studentId: string,
  status: string = 'present'
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
      .select('id, status')
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
      
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          status,
          time_recorded: timestamp
        })
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
    
    const { data: insertData, error: insertError } = await supabase
      .from('attendance')
      .insert({
        student_id: studentId,
        status,
        date: today,
        time_recorded: timestamp
      })
      .select('id');
      
    if (insertError) {
      console.error('Error inserting attendance:', insertError);
      toast.error('Failed to create attendance record');
      return false;
    }
    
    console.log('Attendance record created successfully with ID:', insertData?.[0]?.id);
    return true;
  } catch (error) {
    console.error('Error in markAttendance:', error);
    toast.error('An unexpected error occurred while marking attendance');
    return false;
  }
};
