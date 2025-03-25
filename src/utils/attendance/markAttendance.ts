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
      
      return true;
    }
    
    // Otherwise, insert new attendance record
    const { error: insertError } = await supabase
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
    
    return true;
  } catch (error) {
    console.error('Error in markAttendance:', error);
    return false;
  }
};
