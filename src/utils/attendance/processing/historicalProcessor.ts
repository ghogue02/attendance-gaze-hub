
import { supabase } from '@/integrations/supabase/client';

/**
 * Process historical attendance data for a date range
 * This will:
 * 1. Update all 'pending' attendance records to 'absent'
 * 2. Create 'absent' records for students who have no record on specific dates
 * 
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Object with counts of updated and created records
 */
export const processHistoricalAttendance = async (
  startDate: string,
  endDate: string
): Promise<{ updated: number; created: number }> => {
  console.log(`Processing historical attendance from ${startDate} to ${endDate}`);
  
  try {
    const result = { updated: 0, created: 0 };
    
    // Convert string dates to Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Validate date range
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
    }
    
    if (startDateObj > endDateObj) {
      throw new Error('Start date must be before or equal to end date.');
    }
    
    // 1. Fetch all students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id');
      
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }
    
    if (!students || students.length === 0) {
      console.log('No students found in the database.');
      return result;
    }
    
    console.log(`Processing historical attendance for ${students.length} students`);
    
    // Prepare array of dates between start and end dates
    const dates: string[] = [];
    const currentDate = new Date(startDateObj);
    
    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`Processing ${dates.length} dates from ${dates[0]} to ${dates[dates.length - 1]}`);
    
    // 2. Update all 'pending' records to 'absent'
    const { data: updatedRecords, error: updateError } = await supabase
      .from('attendance')
      .update({
        status: 'absent',
        time_recorded: new Date().toISOString(),
        notes: 'Automatically marked as absent (historical processing)'
      })
      .eq('status', 'pending')
      .gte('date', startDate)
      .lte('date', endDate)
      .select('id');
      
    if (updateError) {
      console.error('Error updating pending records:', updateError);
      throw new Error(`Failed to update pending records: ${updateError.message}`);
    }
    
    result.updated = updatedRecords?.length || 0;
    console.log(`Updated ${result.updated} pending records to absent`);
    
    // 3. For each date and student, check if there's an attendance record
    // and create one if missing
    for (const date of dates) {
      // Get all students who already have a record for this date
      const { data: existingRecords, error: fetchError } = await supabase
        .from('attendance')
        .select('student_id')
        .eq('date', date);
        
      if (fetchError) {
        console.error(`Error fetching records for ${date}:`, fetchError);
        continue;
      }
      
      // Create a set of student IDs who already have records
      const studentsWithRecords = new Set(existingRecords?.map(record => record.student_id) || []);
      
      // Find students missing records for this date
      const missingStudents = students.filter(student => !studentsWithRecords.has(student.id));
      
      if (missingStudents.length === 0) {
        console.log(`All students have records for ${date}`);
        continue;
      }
      
      console.log(`Creating absent records for ${missingStudents.length} students on ${date}`);
      
      // Create records for students missing attendance on this date
      const newRecords = missingStudents.map(student => ({
        student_id: student.id,
        date,
        status: 'absent',
        time_recorded: new Date().toISOString(),
        notes: 'Automatically marked as absent (historical processing)'
      }));
      
      const { data: createdRecords, error: insertError } = await supabase
        .from('attendance')
        .insert(newRecords)
        .select('id');
        
      if (insertError) {
        console.error(`Error creating records for ${date}:`, insertError);
        continue;
      }
      
      result.created += createdRecords?.length || 0;
    }
    
    console.log(`Historical processing complete. Updated: ${result.updated}, Created: ${result.created}`);
    return result;
    
  } catch (error) {
    console.error('Error in processHistoricalAttendance:', error);
    throw error;
  }
};
