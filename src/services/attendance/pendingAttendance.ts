
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Export a function to mark pending attendance records as absent for a specific date
export const markPendingAsAbsent = async (dateString: string): Promise<number> => {
  console.log(`[markPendingAsAbsent] Processing pending attendance for ${dateString}`);
  try {
    // 1. Find all students who have no attendance record or 'pending' status for the given date
    const { data: studentsWithoutAttendance, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .order('last_name');
    
    if (studentsError) {
      console.error(`[markPendingAsAbsent] Error fetching students:`, studentsError);
      return 0;
    }
    
    if (!studentsWithoutAttendance || studentsWithoutAttendance.length === 0) {
      console.log(`[markPendingAsAbsent] No students found in the database.`);
      return 0;
    }
    
    // 2. Get all attendance records for that date to compare
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status, excuse_reason')
      .eq('date', dateString);
    
    if (attendanceError) {
      console.error(`[markPendingAsAbsent] Error fetching attendance:`, attendanceError);
      return 0;
    }
    
    // 3. Create a map of student IDs with their attendance status and excuse reason
    const attendanceMap = new Map();
    attendanceRecords?.forEach(record => {
      attendanceMap.set(record.student_id, {
        status: record.status,
        excuse_reason: record.excuse_reason
      });
    });
    
    // 4. Find students who need to be marked absent - exclude those with manual entries
    const studentsToMarkAbsent = studentsWithoutAttendance.filter(student => {
      const attendance = attendanceMap.get(student.id);
      
      if (!attendance) {
        // No record at all - should be marked absent
        console.log(`[markPendingAsAbsent] ${student.first_name} ${student.last_name} has no attendance record`);
        return true;
      }
      
      if (attendance.status === 'pending') {
        // Pending status - should be marked absent
        console.log(`[markPendingAsAbsent] ${student.first_name} ${student.last_name} has pending status`);
        return true;
      }
      
      if (attendance.status === 'absent' && attendance.excuse_reason) {
        // Manual excused absence - preserve it
        console.log(`[markPendingAsAbsent] PRESERVING manual excused absence for ${student.first_name} ${student.last_name} with reason: "${attendance.excuse_reason}"`);
        return false;
      }
      
      // All other statuses (present, late, absent without excuse) - leave them alone
      console.log(`[markPendingAsAbsent] ${student.first_name} ${student.last_name} already has status: ${attendance.status}, skipping`);
      return false;
    });
    
    console.log(`[markPendingAsAbsent] Found ${studentsToMarkAbsent.length} students to mark as absent for ${dateString}`);
    
    if (studentsToMarkAbsent.length === 0) {
      return 0;
    }
    
    // 5. Handle pending records and missing records separately
    const currentTime = new Date().toISOString();
    
    // Update existing pending records
    const pendingStudentIds = studentsToMarkAbsent
      .filter(student => {
        const attendance = attendanceMap.get(student.id);
        return attendance && attendance.status === 'pending';
      })
      .map(student => student.id);
    
    let updatedCount = 0;
    
    if (pendingStudentIds.length > 0) {
      console.log(`[markPendingAsAbsent] Updating ${pendingStudentIds.length} pending records to absent`);
      
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          status: 'absent',
          time_recorded: currentTime,
          notes: 'Automatically marked absent (was pending)'
        })
        .in('student_id', pendingStudentIds)
        .eq('date', dateString);
      
      if (updateError) {
        console.error(`[markPendingAsAbsent] Error updating pending records:`, updateError);
      } else {
        updatedCount += pendingStudentIds.length;
      }
    }
    
    // Create new records for students with no attendance record
    const missingStudents = studentsToMarkAbsent.filter(student => {
      const attendance = attendanceMap.get(student.id);
      return !attendance;
    });
    
    if (missingStudents.length > 0) {
      console.log(`[markPendingAsAbsent] Creating ${missingStudents.length} new absent records`);
      
      const newRecords = missingStudents.map(student => ({
        student_id: student.id,
        date: dateString,
        status: 'absent',
        time_recorded: currentTime,
        notes: 'Automatically marked absent (no record for day)'
      }));
      
      const { error: insertError } = await supabase
        .from('attendance')
        .insert(newRecords);
      
      if (insertError) {
        console.error(`[markPendingAsAbsent] Error creating absent records:`, insertError);
      } else {
        updatedCount += missingStudents.length;
      }
    }
    
    console.log(`[markPendingAsAbsent] Successfully processed ${updatedCount} students as absent for ${dateString}`);
    return updatedCount;
    
  } catch (error) {
    console.error(`[markPendingAsAbsent] Unexpected error:`, error);
    return 0;
  }
};

// Process pending attendance for a specific date
export const processPendingAttendance = async (dateString: string): Promise<number> => {
  console.log(`[processPendingAttendance] Processing attendance for ${dateString}`);
  try {
    // Find all attendance records for the date with 'pending' status
    const { data: pendingRecords, error: pendingError } = await supabase
      .from('attendance')
      .select('id, student_id')
      .eq('date', dateString)
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('[processPendingAttendance] Error fetching pending records:', pendingError);
      return 0;
    }
    
    if (!pendingRecords || pendingRecords.length === 0) {
      console.log(`[processPendingAttendance] No pending records found for ${dateString}`);
      
      // Also try to find students with no records and create absent records for them
      return await markPendingAsAbsent(dateString);
    }
    
    // Update pending records to absent
    const { error: updateError } = await supabase
      .from('attendance')
      .update({ 
        status: 'absent',
        time_recorded: new Date().toISOString(),
        notes: 'Automatically updated from pending to absent'
      })
      .in('id', pendingRecords.map(r => r.id));
    
    if (updateError) {
      console.error('[processPendingAttendance] Error updating pending records:', updateError);
      return 0;
    }
    
    console.log(`[processPendingAttendance] Updated ${pendingRecords.length} pending records to absent for ${dateString}`);
    return pendingRecords.length;
    
  } catch (error) {
    console.error('[processPendingAttendance] Error:', error);
    return 0;
  }
};

// Process attendance for a specific date
export const processAttendanceForDate = async (dateString: string): Promise<number> => {
  console.log(`Processing attendance for ${dateString}`);
  try {
    // Find all attendance records for the date
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('id, student_id, status')
      .eq('date', dateString);
    
    if (attendanceError) {
      console.error('Error fetching attendance records:', attendanceError);
      return 0;
    }
    
    if (!attendanceRecords || attendanceRecords.length === 0) {
      console.log(`No attendance records found for ${dateString}`);
      return 0;
    }
    
    let updatedCount = 0;
    
    // Loop through each record and update if necessary
    for (const record of attendanceRecords) {
      if (record.status === 'pending') {
        // Update pending records to absent
        const { error: updateError } = await supabase
          .from('attendance')
          .update({ 
            status: 'absent',
            time_recorded: new Date().toISOString(),
            notes: 'Automatically updated from pending to absent'
          })
          .eq('id', record.id);
        
        if (updateError) {
          console.error('Error updating pending record:', updateError);
        } else {
          updatedCount++;
        }
      }
    }
    
    console.log(`Updated ${updatedCount} pending records to absent for ${dateString}`);
    return updatedCount;
    
  } catch (error) {
    console.error('Error processing attendance:', error);
    return 0;
  }
};

// Function to remove April 4th (Friday) attendance records
export const removeApril4thRecords = async (): Promise<number> => {
  const targetDate = '2025-04-04'; // April 4th, 2025 (Friday)
  console.log(`[removeApril4thRecords] Removing attendance records for ${targetDate}`);
  
  try {
    // First, get all attendance records for April 4th
    const { data: april4Records, error: fetchError } = await supabase
      .from('attendance')
      .select('id')
      .eq('date', targetDate);
      
    if (fetchError) {
      console.error('[removeApril4thRecords] Error fetching April 4th records:', fetchError);
      return 0;
    }
    
    if (!april4Records || april4Records.length === 0) {
      console.log('[removeApril4thRecords] No records found for April 4th, 2025');
      return 0;
    }
    
    const recordCount = april4Records.length;
    console.log(`[removeApril4thRecords] Found ${recordCount} records to delete`);
    
    // Delete the records
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('date', targetDate);
      
    if (deleteError) {
      console.error('[removeApril4thRecords] Error deleting April 4th records:', deleteError);
      return 0;
    }
    
    console.log(`[removeApril4thRecords] Successfully removed ${recordCount} records for April 4th, 2025`);
    return recordCount;
  } catch (error) {
    console.error('[removeApril4thRecords] Unexpected error:', error);
    return 0;
  }
};
