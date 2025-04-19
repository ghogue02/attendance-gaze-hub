
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

    // First, get ALL attendance records with student_ids 
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, notes, created_at, date')
      .not('student_id', 'is', null);

    if (attendanceError) {
      console.error('Error fetching attendance data:', attendanceError);
      toast.error('Failed to fetch attendance data');
      return 0;
    }

    // Get all current students for comparison
    const { data: currentStudents, error: studentsError } = await supabase
      .from('students')
      .select('id');

    if (studentsError) {
      console.error('Error fetching current students:', studentsError);
      toast.error('Failed to fetch current students');
      return 0;
    }

    // Create a Set of current student IDs for faster lookup
    const currentStudentIds = new Set(currentStudents.map(s => s.id));

    // Group attendance records by student_id and get the most recent info
    const studentAttendanceMap = new Map();
    attendanceData.forEach(record => {
      if (!currentStudentIds.has(record.student_id)) { // Only process IDs not in the current students table
        if (!studentAttendanceMap.has(record.student_id) || 
            (record.date && studentAttendanceMap.get(record.student_id).date && 
             new Date(record.date) > new Date(studentAttendanceMap.get(record.student_id).date))) {
          studentAttendanceMap.set(record.student_id, {
            notes: record.notes,
            created_at: record.created_at,
            date: record.date
          });
        }
      }
    });

    // Find student IDs that exist in attendance but not in current students
    const deletedStudentIds = [...studentAttendanceMap.keys()];
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
      
      // Check if this builder already exists in the students table
      const { data: existingArchived } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .single();
        
      if (existingArchived) {
        console.log(`Builder ${studentId} already exists in the database, skipping`);
        continue;
      }
      
      const lastSeenDate = attendanceInfo?.date 
        ? new Date(attendanceInfo.date).toLocaleDateString() 
        : attendanceInfo?.created_at 
          ? new Date(attendanceInfo.created_at).toLocaleDateString()
          : 'Unknown';
      
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          id: studentId,
          first_name: firstName,
          last_name: lastName,
          email: `recovered-${studentId}@example.com`,
          archived_at: new Date().toISOString(),
          archived_reason: `Recovered from deleted status. Last seen: ${lastSeenDate}`
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
    } else {
      toast.info('No new deleted builders found to recover');
    }
    
    return recoveredCount;
  } catch (error) {
    console.error('Error during builder recovery process:', error);
    toast.error('An error occurred during builder recovery');
    return 0;
  }
};
