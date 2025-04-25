
import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { toast } from 'sonner';
import { isClassDay } from '../../attendance/isClassDay';

// Global debug flag - set to false to reduce console noise
const DEBUG_LOGGING = false;

export const fetchBuildersWithAttendance = async (targetDateString: string): Promise<Builder[]> => {
  try {
    DEBUG_LOGGING && console.log('Fetching builders with attendance for date:', targetDateString);
    
    if (!isClassDay(targetDateString)) {
      console.warn(`Skipping non-class date: ${targetDateString}`);
      return [];
    }

    // --- 1. Fetch all active students in a single query ---
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, last_name, student_id, image_url, notes')
      .is('archived_at', null) // Only fetch non-archived students
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      toast.error(`Failed to fetch student list: ${studentsError.message}`);
      return [];
    }
    
    if (!students || students.length === 0) {
      console.warn('No students found in the database.');
      return [];
    }

    // --- 2. Fetch attendance records for the TARGET date in a single query ---
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status, time_recorded, excuse_reason, notes')
      .eq('date', targetDateString);

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      toast.error(`Failed to fetch attendance data: ${attendanceError.message}`);
      return [];
    }

    // --- 3. Create Attendance Map ---
    const attendanceMap = new Map();
    attendanceRecords?.forEach(record => {
      if (record.student_id) {
        attendanceMap.set(record.student_id, record);
      }
    });

    // --- 4. Map students to builders with attendance ---
    return students.map(student => {
      const attendanceRecord = attendanceMap.get(student.id);
      
      let calculatedStatus: BuilderStatus = 'pending';
      let timeRecorded: string | undefined = undefined;
      let excuseReason: string | undefined = undefined;
      let attendanceNotes: string | undefined = undefined;

      if (attendanceRecord) {
        calculatedStatus = attendanceRecord.status as BuilderStatus;
        excuseReason = attendanceRecord.excuse_reason || undefined;
        attendanceNotes = attendanceRecord.notes || undefined;
        
        if (attendanceRecord.time_recorded) {
          timeRecorded = new Date(attendanceRecord.time_recorded).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        }

        if (calculatedStatus === 'absent' && excuseReason) {
          calculatedStatus = 'excused';
        }
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
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error('An unexpected error occurred while fetching builder data.');
    return [];
  }
};
