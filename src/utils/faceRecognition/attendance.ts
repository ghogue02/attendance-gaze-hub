// src/utils/faceRecognition/attendance.ts

import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { toast } from 'sonner';

/**
 * Gets all builders (students) with their merged attendance status for today.
 */
export const getAllBuilders = async (): Promise<Builder[]> => {
  try {
    console.log('[getAllBuilders] Fetching all students and today\'s attendance...');

    // Get the current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('[getAllBuilders] Target date:', today);

    // 1. Fetch all students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, last_name, student_id, image_url, notes') // Select all needed fields
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (studentsError) {
      console.error('[getAllBuilders] Error fetching students:', studentsError);
      toast.error(`Failed to fetch student list: ${studentsError.message}`);
      return [];
    }
    if (!students) {
        console.warn('[getAllBuilders] No students found.');
        return [];
    }

    console.log(`[getAllBuilders] Retrieved ${students.length} students.`);

    // 2. Fetch all attendance records for today
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status, time_recorded, excuse_reason, notes') // Select only needed fields
      .eq('date', today);

    if (attendanceError) {
      // Log the error but don't necessarily stop; we can still show students as pending
      console.error('[getAllBuilders] Error fetching attendance:', attendanceError);
      toast.warning(`Could not fetch today's attendance: ${attendanceError.message}`);
      // Continue processing with students but no attendance data
    }

    console.log(`[getAllBuilders] Retrieved ${attendanceRecords?.length || 0} attendance records for today.`);

    // 3. Create a map of student IDs to today's attendance records for efficient lookup
    const attendanceMap = new Map();
    attendanceRecords?.forEach(record => {
      // Store the latest record if multiple exist for the same student today (shouldn't happen with constraints)
      attendanceMap.set(record.student_id, record);
    });

    // 4. Map students to the Builder type, merging attendance status
    const builders: Builder[] = students.map(student => {
      const attendanceRecord = attendanceMap.get(student.id);
      let calculatedStatus: BuilderStatus = 'pending'; // Default status
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

        // Determine the final status based on the record
        if (recordStatus === 'present') {
          calculatedStatus = 'present';
        } else if (recordStatus === 'late') {
          calculatedStatus = 'late';
        } else if (recordStatus === 'excused') {
          // Handle cases where status might already be 'excused'
          calculatedStatus = 'excused';
        } else if (recordStatus === 'absent') {
          // If absent, check for an excuse reason to mark as 'excused'
          calculatedStatus = excuseReason ? 'excused' : 'absent';
        }
        // 'pending' status from DB is overridden if a record exists, otherwise default is 'pending'
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
        // Combine notes: prioritize attendance notes, fallback to student notes
        notes: attendanceNotes || student.notes || undefined
      };
    });

    console.log(`[getAllBuilders] Processed ${builders.length} builders. Present count: ${builders.filter(b => b.status === 'present').length}`);

    return builders;

  } catch (error) {
    console.error('[getAllBuilders] Unexpected error:', error);
    toast.error('An unexpected error occurred while fetching builder data.');
    return [];
  }
};