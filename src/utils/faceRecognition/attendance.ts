
// src/utils/faceRecognition/attendance.ts

import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { toast } from 'sonner';

// Global debug flag - set to false to reduce console noise
const DEBUG_LOGGING = false;

// In-memory cache for optimizing API calls
const attendanceCache = {
  byDate: new Map<string, Builder[]>(),
  timestamp: new Map<string, number>(),
  ttl: 60000 * 5 // 5 minutes cache TTL
};

/**
 * Gets all builders (students) with their merged attendance status for a specific date.
 * Optimized to reduce database calls with caching and batched queries.
 * @param targetDateString - The date to fetch attendance for, in 'YYYY-MM-DD' format.
 */
export const getAllBuilders = async (targetDateString: string): Promise<Builder[]> => {
  const functionName = '[getAllBuilders]';
  
  try {
    DEBUG_LOGGING && console.log(`${functionName} Starting fetch for date: ${targetDateString}`);
    
    // Skip processing if the date is April 11 or April 4, 2025 (problematic dates)
    if (targetDateString === '2025-04-11' || targetDateString === '2025-04-04') {
      console.warn(`${functionName} Skipping problematic date: ${targetDateString}`);
      return [];
    }

    // Check cache first
    const now = Date.now();
    const cachedData = attendanceCache.byDate.get(targetDateString);
    const cacheTime = attendanceCache.timestamp.get(targetDateString) || 0;
    
    if (cachedData && (now - cacheTime < attendanceCache.ttl)) {
      DEBUG_LOGGING && console.log(`${functionName} Using cached data for ${targetDateString}, cached ${Math.floor((now - cacheTime)/1000)}s ago`);
      return [...cachedData]; // Return a copy to prevent mutation of cache
    }

    // --- 1. Fetch all students in a single query ---
    DEBUG_LOGGING && console.log(`${functionName} Cache miss, fetching fresh data for ${targetDateString}`);
    
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
    DEBUG_LOGGING && console.log(`${functionName} Retrieved ${students.length} students.`);

    // --- 2. Fetch attendance records for the TARGET date in a single query ---
    DEBUG_LOGGING && console.log(`${functionName} Fetching attendance records for date: ${targetDateString}`);
    
    // Fetch all attendance records for this date in a single query
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status, time_recorded, excuse_reason, notes')
      .eq('date', targetDateString);

    if (attendanceError) {
      console.error(`${functionName} Error fetching attendance:`, attendanceError);
      toast.error(`Failed to fetch attendance data: ${attendanceError.message}`);
      return [];
    }
    
    DEBUG_LOGGING && console.log(`${functionName} Retrieved ${attendanceRecords?.length || 0} attendance records for ${targetDateString}.`);

    // --- 3. Create Attendance Map ---
    const attendanceMap = new Map();
    attendanceRecords?.forEach(record => {
      if (record.student_id) {
        attendanceMap.set(record.student_id, record);
      }
    });
    
    // --- 4. Map students, merging attendance ---
    const builders: Builder[] = students.map(student => {
      const attendanceRecord = attendanceMap.get(student.id);
      
      let calculatedStatus: BuilderStatus = 'pending';
      let timeRecorded: string | undefined = undefined;
      let excuseReason: string | undefined = undefined;
      let attendanceNotes: string | undefined = undefined;

      if (attendanceRecord) {
        const recordStatus = attendanceRecord.status;
        excuseReason = attendanceRecord.excuse_reason || undefined;
        attendanceNotes = attendanceRecord.notes || undefined;
        
        if (attendanceRecord.time_recorded) {
          timeRecorded = new Date(attendanceRecord.time_recorded).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        }

        if (recordStatus === 'present') calculatedStatus = 'present';
        else if (recordStatus === 'late') calculatedStatus = 'late';
        else if (recordStatus === 'excused') calculatedStatus = 'excused';
        else if (recordStatus === 'absent') calculatedStatus = excuseReason ? 'excused' : 'absent';
        // else status remains 'pending'
      }

      return {
        id: student.id,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        builderId: student.student_id || 'N/A',
        status: calculatedStatus,
        timeRecorded,
        image: student.image_url,
        excuseReason,
        notes: attendanceNotes || student.notes
      };
    });

    // Update cache
    attendanceCache.byDate.set(targetDateString, [...builders]);
    attendanceCache.timestamp.set(targetDateString, now);

    return builders;
  } catch (error) {
    console.error(`${functionName} Unexpected error:`, error);
    toast.error('An unexpected error occurred while fetching builder data.');
    return [];
  }
};

/**
 * Clear the attendance cache for a specific date or all dates
 */
export const clearAttendanceCache = (date?: string) => {
  if (date) {
    attendanceCache.byDate.delete(date);
    attendanceCache.timestamp.delete(date);
    console.log(`[clearAttendanceCache] Cleared cache for date: ${date}`);
  } else {
    attendanceCache.byDate.clear();
    attendanceCache.timestamp.clear();
    console.log('[clearAttendanceCache] Cleared entire attendance cache');
  }
};
