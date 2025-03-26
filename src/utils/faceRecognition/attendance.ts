
import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/builder/types';
import { toast } from 'sonner';

/**
 * Gets all builders with their current attendance status for today
 */
export const getAllBuilders = async (): Promise<Builder[]> => {
  try {
    console.log('Fetching all builders with attendance status');
    
    // Get the current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('Fetching attendance for date:', today);
    
    // First, fetch all students with better ordering - by last_name, then first_name
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });
      
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return [];
    }
    
    console.log(`Retrieved ${students.length} students from database`);
    
    // Then, fetch all attendance records for today
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', today);
      
    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return [];
    }
    
    console.log(`Retrieved ${attendanceRecords?.length || 0} attendance records for today (${today})`);
    
    // Create a map of student IDs to attendance records for faster lookup
    const attendanceMap = new Map();
    attendanceRecords?.forEach(record => {
      attendanceMap.set(record.student_id, {
        status: record.status,
        timeRecorded: record.time_recorded ? new Date(record.time_recorded).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : undefined,
        excuseReason: record.excuse_reason,
        notes: record.notes
      });
    });
    
    // Map students to builders with their attendance status
    const builders: Builder[] = students.map(student => {
      const attendanceRecord = attendanceMap.get(student.id);
      
      // Default to 'pending' if no attendance record exists for today
      let status = attendanceRecord?.status || 'pending';
      
      // If attendance record is 'absent' but has excuse_reason, mark as 'excused'
      if (status === 'absent' && attendanceRecord?.excuseReason) {
        status = 'excused';
      }
      
      // Create a formatted display name that handles multiple last names properly
      const fullName = `${student.first_name} ${student.last_name || ''}`.trim();
      
      return {
        id: student.id,
        name: fullName,
        builderId: student.student_id || '',
        status: status,
        timeRecorded: attendanceRecord?.timeRecorded,
        image: student.image_url,
        excuseReason: attendanceRecord?.excuseReason,
        notes: attendanceRecord?.notes || student.notes
      };
    });
    
    // Log the builders we're returning
    console.log('Processed builders with attendance status:', builders.length, 'Present:', builders.filter(b => b.status === 'present').length);
    
    return builders;
    
  } catch (error) {
    console.error('Error in getAllBuilders:', error);
    toast.error('Failed to fetch builders data');
    return [];
  }
};
