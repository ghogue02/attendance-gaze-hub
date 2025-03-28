
import { supabase } from '@/integrations/supabase/client';

/**
 * Marks pending students as absent for a specific date
 * @param date ISO format date string (YYYY-MM-DD)
 * @returns Number of students marked as absent
 */
export const markPendingAsAbsent = async (date: string): Promise<number> => {
  try {
    console.log(`Checking for pending students on ${date} to mark as absent`);
    
    // First fetch all students to know who should have an attendance record
    const { data: allStudents, error: studentsError } = await supabase
      .from('students')
      .select('id');
      
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return 0;
    }
    
    if (!allStudents || allStudents.length === 0) {
      console.log('No students found');
      return 0;
    }
    
    // Get all existing attendance records for the date
    const { data: existingAttendance, error: fetchError } = await supabase
      .from('attendance')
      .select('id, student_id, status')
      .eq('date', date);
      
    if (fetchError) {
      console.error('Error fetching attendance records:', fetchError);
      return 0;
    }
    
    // Find all students with pending status
    const pendingRecords = existingAttendance?.filter(record => record.status === 'pending') || [];
    
    // Find students missing records completely (no record at all for this date)
    const studentIdsWithRecords = new Set(existingAttendance?.map(record => record.student_id) || []);
    const missingStudents = allStudents.filter(student => !studentIdsWithRecords.has(student.id));
    
    console.log(`Found ${pendingRecords.length} pending students and ${missingStudents.length} missing students to mark as absent for ${date}`);
    
    // Update pending records to absent
    if (pendingRecords.length > 0) {
      const { error: updateError } = await supabase
        .from('attendance')
        .update({ 
          status: 'absent',
          time_recorded: new Date().toISOString(),
          notes: 'Automatically marked as absent (end of day)'
        })
        .in('id', pendingRecords.map(record => record.id));
        
      if (updateError) {
        console.error('Error marking pending as absent:', updateError);
      }
    }
    
    // Create absent records for students with no record
    if (missingStudents.length > 0) {
      const newRecords = missingStudents.map(student => ({
        student_id: student.id,
        date,
        status: 'absent',
        time_recorded: new Date().toISOString(),
        notes: 'Automatically marked as absent (no record for day)'
      }));
      
      const { error: insertError } = await supabase
        .from('attendance')
        .insert(newRecords);
        
      if (insertError) {
        console.error('Error creating absent records:', insertError);
      }
    }
    
    const totalMarked = pendingRecords.length + missingStudents.length;
    console.log(`Successfully marked ${totalMarked} students as absent for ${date}`);
    return totalMarked;
  } catch (error) {
    console.error('Error in markPendingAsAbsent:', error);
    return 0;
  }
};
