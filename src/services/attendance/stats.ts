
import { supabase } from '@/integrations/supabase/client';
import { isClassDay } from '@/utils/attendance/isClassDay';

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');

// Get attendance statistics for the front page
export const fetchStats = async () => {
  try {
    // Get current date
    const today = new Date().toISOString().split('T')[0];
    
    // Get total number of builders
    const { data: studentCount, error: studentError } = await supabase
      .from('students')
      .select('id', { count: 'exact' });
      
    if (studentError) {
      console.error('Error fetching student count:', studentError);
      throw studentError;
    }
    
    // Get attendance for today
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('status, date, student_id');
      
    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      throw attendanceError;
    }
    
    // Filter out records for non-class days or before MINIMUM_DATE
    const filteredAttendance = attendanceData?.filter(record => {
      const date = new Date(record.date);
      return isClassDay(record.date) && date >= MINIMUM_DATE;
    }) || [];

    console.log(`Stats: Filtered ${attendanceData?.length || 0} records down to ${filteredAttendance.length}`);

    // Get today's attendance
    const todayAttendance = filteredAttendance.filter(record => record.date === today);
    
    // Process attendance data
    const totalBuilders = studentCount?.length || 0;
    const presentCount = todayAttendance?.filter(r => r.status === 'present').length || 0;
    const lateCount = todayAttendance?.filter(r => r.status === 'late').length || 0;
    
    // Calculate attendance rate (present + late)
    // If all students are present or late, it's 100%
    const presentAndLateCount = presentCount + lateCount;
    const attendanceRate = totalBuilders > 0 
      ? (presentAndLateCount >= totalBuilders ? 100 : Math.round((presentAndLateCount / totalBuilders) * 100))
      : 0;

    console.log(`Stats: Attendance rate for today: ${attendanceRate}%, Present: ${presentCount}, Late: ${lateCount}, Total: ${totalBuilders}`);
      
    return {
      totalBuilders,
      attendanceRate
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalBuilders: 0,
      attendanceRate: 0
    };
  }
};
