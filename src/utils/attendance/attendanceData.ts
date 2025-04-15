
import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { toast } from 'sonner';

// Cache for attendance data
const attendanceCache = new Map<string, {
  data: Builder[];
  timestamp: number;
}>();

/**
 * Clear attendance cache for a specific date or all dates
 */
export function clearAttendanceCache(date?: string) {
  if (date) {
    attendanceCache.delete(date);
    console.log(`[clearAttendanceCache] Cleared cache for date: ${date}`);
  } else {
    attendanceCache.clear();
    console.log('[clearAttendanceCache] Cleared entire attendance cache');
  }
}

/**
 * Retrieves all builders with their attendance data for a specific date
 * @param targetDateString Date to fetch attendance for (YYYY-MM-DD)
 * @returns List of builders with attendance status
 */
export async function getAllBuilders(targetDateString: string): Promise<Builder[]> {
  // Skip problematic dates
  if (targetDateString === '2025-04-11' || targetDateString === '2025-04-04') {
    console.warn(`[getAllBuilders] Skipping problematic date: ${targetDateString}`);
    return [];
  }

  // Check cache
  const cached = attendanceCache.get(targetDateString);
  if (cached && Date.now() - cached.timestamp < 3 * 60 * 1000) { // 3 minute TTL
    console.log(`[getAllBuilders] Using cached data for ${targetDateString}`);
    return [...cached.data]; // Return copy to prevent mutation
  }

  try {
    // Fetch all students in a single query
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, last_name, student_id, image_url, notes')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (studentsError) {
      console.error(`[getAllBuilders] Error fetching students:`, studentsError);
      throw new Error(`Failed to fetch student list: ${studentsError.message}`);
    }

    if (!students || students.length === 0) {
      return [];
    }

    // Fetch attendance records for the target date in a single query
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status, time_recorded, excuse_reason, notes')
      .eq('date', targetDateString);

    if (attendanceError) {
      console.error(`[getAllBuilders] Error fetching attendance:`, attendanceError);
      throw new Error(`Failed to fetch attendance data: ${attendanceError.message}`);
    }

    // Create attendance map for quick lookup
    const attendanceMap = new Map();
    attendanceRecords?.forEach(record => {
      if (record.student_id) {
        attendanceMap.set(record.student_id, record);
      }
    });

    // Merge student and attendance data
    const builders: Builder[] = students.map(student => {
      const attendanceRecord = attendanceMap.get(student.id);
      
      let status: BuilderStatus = 'pending';
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

        if (recordStatus === 'present') status = 'present';
        else if (recordStatus === 'late') status = 'late';
        else if (recordStatus === 'excused') status = 'excused';
        else if (recordStatus === 'absent') status = excuseReason ? 'excused' : 'absent';
      }

      return {
        id: student.id,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        builderId: student.student_id || 'N/A',
        status,
        timeRecorded,
        image: student.image_url,
        excuseReason,
        notes: attendanceNotes || student.notes
      };
    });

    // Store in cache
    attendanceCache.set(targetDateString, {
      data: [...builders], // Store a copy
      timestamp: Date.now()
    });

    return builders;
  } catch (error) {
    console.error(`[getAllBuilders] Unexpected error:`, error);
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred while fetching builder data.');
    }
    return [];
  }
}
