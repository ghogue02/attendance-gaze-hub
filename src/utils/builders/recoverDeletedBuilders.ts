
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

    console.log(`Found ${attendanceData?.length || 0} total attendance records with student IDs`);

    // Get all current students for comparison
    const { data: currentStudents, error: studentsError } = await supabase
      .from('students')
      .select('id');

    if (studentsError) {
      console.error('Error fetching current students:', studentsError);
      toast.error('Failed to fetch current students');
      return 0;
    }

    console.log(`Found ${currentStudents?.length || 0} current students in database`);

    // Create a Set of current student IDs for faster lookup
    const currentStudentIds = new Set(currentStudents.map(s => s.id));

    // Extract unique student IDs from attendance that don't exist in students table
    const missingStudentIds = new Set();
    attendanceData.forEach(record => {
      if (record.student_id && !currentStudentIds.has(record.student_id)) {
        missingStudentIds.add(record.student_id);
      }
    });

    console.log(`Found ${missingStudentIds.size} potentially deleted builders`);
    if (missingStudentIds.size === 0) {
      toast.info('No deleted builders found to recover');
      return 0;
    }

    // Map to store latest attendance info for each missing student
    const studentAttendanceMap = new Map();
    
    // Process all attendance records for missing students to find most recent data
    attendanceData.forEach(record => {
      if (record.student_id && missingStudentIds.has(record.student_id)) {
        const currentData = studentAttendanceMap.get(record.student_id);
        const recordDate = record.date ? new Date(record.date) : 
                           record.created_at ? new Date(record.created_at) : 
                           new Date(0);
        
        if (!currentData || 
            (recordDate > new Date(currentData.date || currentData.created_at || 0))) {
          studentAttendanceMap.set(record.student_id, {
            notes: record.notes,
            created_at: record.created_at,
            date: record.date
          });
        }
      }
    });

    // Find student IDs that exist in attendance but not in current students
    const deletedStudentIds = [...missingStudentIds];
    console.log(`Processing ${deletedStudentIds.length} deleted builders`);

    let recoveredCount = 0;
    for (const studentId of deletedStudentIds) {
      // Get the most recent attendance record for this student
      const attendanceInfo = studentAttendanceMap.get(studentId);
      
      // Try to extract the name from notes (assuming format "Name - Other info")
      let firstName = 'Recovered';
      let lastName = `Builder-${studentId.substring(0, 6)}`;
      
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
        .maybeSingle();
        
      if (existingArchived) {
        console.log(`Builder ${studentId} already exists in the database, skipping`);
        continue;
      }
      
      const lastSeenDate = attendanceInfo?.date 
        ? new Date(attendanceInfo.date).toLocaleDateString() 
        : attendanceInfo?.created_at 
          ? new Date(attendanceInfo.created_at).toLocaleDateString()
          : 'Unknown';
      
      // Force all attendance record-only IDs to be recovered
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          id: studentId,
          first_name: firstName,
          last_name: lastName,
          email: `recovered-${studentId.substring(0, 8)}@example.com`,
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
