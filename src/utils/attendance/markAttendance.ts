import { supabase } from '@/integrations/supabase/client';

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
    
    // Check if attendance has already been recorded for today
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingAttendance, error: checkError } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', studentId)
      .eq('date', today)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking existing attendance:', checkError);
      return false;
    }
    
    // If attendance already exists, update it
    if (existingAttendance) {
      console.log(`Updating existing attendance record (ID: ${existingAttendance.id}) to status: ${status}`);
      
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          status,
          time_recorded: new Date().toISOString()
        })
        .eq('id', existingAttendance.id);
        
      if (updateError) {
        console.error('Error updating attendance:', updateError);
        return false;
      }
      
      console.log('Attendance record updated successfully');
      return true;
    }
    
    // Otherwise, insert new attendance record
    console.log(`Creating new attendance record for student ${studentId} with status: ${status}`);
    
    const { data, error: insertError } = await supabase
      .from('attendance')
      .insert({
        student_id: studentId,
        status,
        date: today,
        time_recorded: new Date().toISOString()
      });
      
    if (insertError) {
      console.error('Error inserting attendance:', insertError);
      return false;
    }
    
    console.log('Attendance record created successfully');
    return true;
  } catch (error) {
    console.error('Error in markAttendance:', error);
    return false;
  }
};
