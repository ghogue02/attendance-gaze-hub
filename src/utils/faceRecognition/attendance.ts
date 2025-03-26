// src/utils/faceRecognition/attendance.ts

import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { toast } from 'sonner';

/**
 * Gets all builders (students) with their merged attendance status for today.
 */
export const getAllBuilders = async (): Promise<Builder[]> => {
  const functionName = '[getAllBuilders]'; // For easier log filtering
  try {
    console.log(`${functionName} Starting fetch...`);

    // Get today's date in YYYY-MM-DD format (consistent with Supabase date type)
    const today = new Date().toISOString().split('T')[0];
    console.log(`${functionName} Target date: ${today}`);

    // --- 1. Fetch all students ---
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, last_name, student_id, image_url, notes')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (studentsError) {
      console.error(`${functionName} Error fetching students:`, studentsError);
      toast.error(`Failed to fetch student list: ${studentsError.message}`);
      return [];
    }
    if (!students || students.length === 0) {
      console.warn(`${functionName} No students found in the database.`);
      return [];
    }
    console.log(`${functionName} Retrieved ${students.length} students.`);

    // --- 2. Fetch today's attendance records ---
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status, time_recorded, excuse_reason, notes')
      .eq('date', today);

    if (attendanceError) {
      console.error(`${functionName} Error fetching attendance for ${today}:`, attendanceError);
      toast.warning(`Could not fetch today's attendance: ${attendanceError.message}`);
      // Continue without attendance data - students will be marked pending
    }
    console.log(`${functionName} Retrieved ${attendanceRecords?.length || 0} attendance records for ${today}.`);

    // --- 3. Create a Map for efficient attendance lookup ---
    const attendanceMap = new Map<string, typeof attendanceRecords[0]>();
    attendanceRecords?.forEach(record => {
      if (record.student_id) {
        // Store the record using the student_id as the key
        attendanceMap.set(record.student_id, record);
      }
    });
    console.log(`${functionName} Created attendance map with ${attendanceMap.size} entries.`);

    // --- 4. Map students to Builder objects, merging attendance ---
    let presentCountCheck = 0; // Counter for logging verification
    const builders: Builder[] = students.map(student => {
      // IMPORTANT: Look up using student.id which should match attendance.student_id (FK)
      const attendanceRecord = attendanceMap.get(student.id);
      let calculatedStatus: BuilderStatus = 'pending'; // Default if no record found
      let timeRecorded: string | undefined = undefined;
      let excuseReason: string | undefined = undefined;
      let attendanceNotes: string | undefined = undefined;

      if (attendanceRecord) {
        // If a record exists for today, determine status
        const recordStatus = attendanceRecord.status;
        excuseReason = attendanceRecord.excuse_reason || undefined;
        attendanceNotes = attendanceRecord.notes || undefined;
        timeRecorded = attendanceRecord.time_recorded
          ? new Date(attendanceRecord.time_recorded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
          : undefined;

        if (recordStatus === 'present') {
          calculatedStatus = 'present';
          presentCountCheck++; // Increment check counter
        } else if (recordStatus === 'late') {
          calculatedStatus = 'late';
        } else if (recordStatus === 'excused') { // Explicit 'excused' status
          calculatedStatus = 'excused';
        } else if (recordStatus === 'absent') {
          calculatedStatus = excuseReason ? 'excused' : 'absent'; // Convert absent->excused if reason exists
        }
        // Ignore 'pending' status from DB if found, default is 'pending' anyway if no record
      }

      const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();

      // Log status calculation for the first few students for debugging
      if (builders.length < 5) {
         console.log(`${functionName} Mapping student ${student.id} (${fullName}): Found attendance? ${!!attendanceRecord}. Calculated Status: ${calculatedStatus}`);
      }

      return {
        id: student.id,
        name: fullName || 'Unnamed Builder',
        builderId: student.student_id || 'N/A',
        status: calculatedStatus,
        timeRecorded: timeRecorded,
        image: student.image_url || undefined,
        excuseReason: excuseReason,
        notes: attendanceNotes || student.notes || undefined // Prioritize attendance notes
      };
    });

    // Final verification log
    console.log(`${functionName} Finished mapping. Final present count check: ${presentCountCheck}. Total builders returned: ${builders.length}`);
    if (presentCountCheck === 0 && attendanceRecords && attendanceRecords.length > 0) {
        console.warn(`${functionName} Mismatch detected: Attendance records found, but present count check is zero. Check ID matching (student.id vs attendance.student_id) and status logic.`);
    }


    return builders;

  } catch (error) {
    console.error(`${functionName} Unexpected error:`, error);
    toast.error('An unexpected error occurred while fetching builder data.');
    return [];
  }
};