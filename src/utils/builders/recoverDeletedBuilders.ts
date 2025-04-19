
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Recovers previously deleted builders by examining attendance records
 * and creating placeholder archived records for them
 * @returns The number of recovered builders
 */
export const recoverDeletedBuilders = async (): Promise<number> => {
  try {
    console.log('Attempting to recover previously deleted builders');

    // First, get ALL attendance records that have student_ids, regardless of current student existence
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, notes, created_at')
      .not('student_id', 'is', null);

    if (attendanceError) {
      console.error('Error fetching attendance data:', attendanceError);
      return 0;
    }

    // Get all current students for comparison
    const { data: currentStudents, error: studentsError } = await supabase
      .from('students')
      .select('id');

    if (studentsError) {
      console.error('Error fetching current students:', studentsError);
      return 0;
    }

    // Create a Set of current student IDs for faster lookup
    const currentStudentIds = new Set(currentStudents.map(s => s.id));

    // Group attendance records by student_id and get the most recent notes
    const studentAttendanceMap = new Map();
    attendanceData.forEach(record => {
      if (!studentAttendanceMap.has(record.student_id)) {
        studentAttendanceMap.set(record.student_id, {
          notes: record.notes,
          created_at: record.created_at
        });
      } else if (new Date(record.created_at) > new Date(studentAttendanceMap.get(record.student_id).created_at)) {
        // Update if this record is more recent
        studentAttendanceMap.set(record.student_id, {
          notes: record.notes,
          created_at: record.created_at
        });
      }
    });

    // Find student IDs that exist in attendance but not in current students
    const deletedStudentIds = [...studentAttendanceMap.keys()].filter(id => !currentStudentIds.has(id));
    console.log(`Found ${deletedStudentIds.length} potentially deleted builders`);

    let recoveredCount = 0;
    for (const studentId of deletedStudentIds) {
      // Get the most recent attendance record for this student
      const attendanceInfo = studentAttendanceMap.get(studentId);
      
      // Try to extract the name from notes (assuming format "Name - Other info")
      let firstName = 'Recovered';
      let lastName = 'Builder';
      
      if (attendanceInfo?.notes) {
        const noteParts = attendanceInfo.notes.split(' - ');
        if (noteParts[0] && noteParts[0] !== 'Recovered Builder') {
          const nameParts = noteParts[0].trim().split(' ');
          if (nameParts.length >= 1) firstName = nameParts[0];
          if (nameParts.length >= 2) lastName = nameParts.slice(1).join(' ');
        }
      }
      
      console.log(`Attempting to recover builder: ${firstName} ${lastName} (${studentId})`);
      
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          id: studentId,
          first_name: firstName,
          last_name: lastName,
          email: `recovered-${studentId}@example.com`,
          archived_at: new Date().toISOString(),
          archived_reason: `Recovered from deleted status. Last seen: ${new Date(attendanceInfo?.created_at || '').toLocaleDateString()}`
        });

      if (!insertError) {
        recoveredCount++;
        console.log(`Successfully recovered builder: ${firstName} ${lastName}`);
      } else {
        console.error(`Error recovering builder ${studentId}:`, insertError);
      }
    }

    console.log(`Recovery process complete. Recovered ${recoveredCount} builders`);
    if (recoveredCount > 0) {
      toast.success(`Recovered ${recoveredCount} previously deleted builders`);
    }
    
    return recoveredCount;
  } catch (error) {
    console.error('Error during builder recovery process:', error);
    return 0;
  }
};
