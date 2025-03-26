// src/utils/faceRecognition/attendance.ts

import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { toast } from 'sonner';

/**
 * Gets all builders (students) with their merged attendance status for a specific date.
 * @param targetDateString - The date to fetch attendance for, in 'YYYY-MM-DD' format.
 */
export const getAllBuilders = async (targetDateString: string): Promise<Builder[]> => {
  const functionName = '[getAllBuilders]';
  try {
    console.log(`${functionName} Starting fetch for date: ${targetDateString}`);

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

    // --- 2. Fetch attendance records for the TARGET date ---
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status, time_recorded, excuse_reason, notes')
      .eq('date', targetDateString); // Use the passed-in date string

    if (attendanceError) {
      console.error(`${functionName} Error fetching attendance for ${targetDateString}:`, attendanceError);
      toast.warning(`Could not fetch attendance for ${targetDateString}: ${attendanceError.message}`);
      // Continue without attendance data
    }
    console.log(`${functionName} Retrieved ${attendanceRecords?.length || 0} attendance records for ${targetDateString}.`);

    // --- 3. Create Attendance Map ---
    const attendanceMap = new Map<string, typeof attendanceRecords[0]>();
    attendanceRecords?.forEach(record => {
      if (record.student_id) {
        attendanceMap.set(record.student_id, record);
      }
    });
    console.log(`${functionName} Created attendance map with ${attendanceMap.size} entries.`);

    // --- 4. Map students, merging attendance ---
    let presentCountCheck = 0;
    const builders: Builder[] = students.map((student, index) => {
      const attendanceRecord = attendanceMap.get(student.id);
      let calculatedStatus: BuilderStatus = 'pending';
      let timeRecorded: string | undefined = undefined;
      let excuseReason: string | undefined = undefined;
      let attendanceNotes: string | undefined = undefined;

      if (attendanceRecord) {
        const recordStatus = attendanceRecord.status;
        excuseReason = attendanceRecord.excuse_reason || undefined;
        attendanceNotes = attendanceRecord.notes || undefined;
        timeRecorded = attendanceRecord.time_recorded
          ? new Date(attendanceRecord.time_recorded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
          : undefined;

        if (recordStatus === 'present') calculatedStatus = 'present';
        else if (recordStatus === 'late') calculatedStatus = 'late';
        else if (recordStatus === 'excused') calculatedStatus = 'excused';
        else if (recordStatus === 'absent') calculatedStatus = excuseReason ? 'excused' : 'absent';
        // else status remains 'pending' (if recordStatus was 'pending' or null/undefined)

        if (calculatedStatus === 'present') presentCountCheck++;

         // Log status calculation for the first few students for debugging
        if (index < 5) {
            console.log(`${functionName} Mapping student ${student.id} (${student.first_name}): Found attendance? ${!!attendanceRecord}. DB Status: ${recordStatus}. Calculated Status: ${calculatedStatus}`);
        }
      } else {
         // Log if no record found for first few
         if (index < 5) {
             console.log(`${functionName} Mapping student ${student.id} (${student.first_name}): No attendance record found. Status: pending`);
         }
      }

      const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();

      return {
        id: student.id,
        name: fullName || 'Unnamed Builder',
        builderId: student.student_id || 'N/A',
        status: calculatedStatus,
        timeRecorded: timeRecorded,
        image: student.image_url || undefined,
        excuseReason: excuseReason,
        notes: attendanceNotes || student.notes || undefined
      };
    });

    console.log(`${functionName} Finished mapping. Final present count check: ${presentCountCheck}. Total builders returned: ${builders.length}`);
    if (presentCountCheck === 0 && attendanceRecords && attendanceRecords.length > 0 && attendanceRecords.some(r => r.status === 'present')) {
        console.warn(`${functionName} Mismatch detected: 'present' attendance records found, but present count check is zero.`);
    }

    return builders;

  } catch (error) {
    console.error(`${functionName} Unexpected error:`, error);
    toast.error('An unexpected error occurred while fetching builder data.');
    return [];
  }
};