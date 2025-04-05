
import { supabase } from '@/integrations/supabase/client';

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
    
    // Filter out records for Fridays or April 4th, 2025, or before MINIMUM_DATE
    const filteredAttendance = attendanceData?.filter(record => {
      const date = new Date(record.date);
      // Check if it's a Friday or April 4th, 2025
      const isFriday = date.getDay() === 5;
      const isApril4th = date.getFullYear() === 2025 && 
                          date.getMonth() === 3 && // April is month 3 (0-indexed)
                          date.getDate() === 4;
      return !isFriday && !isApril4th && date >= MINIMUM_DATE;
    }) || [];

    console.log(`Stats: Filtered ${attendanceData?.length || 0} records down to ${filteredAttendance.length}`);

    // Get today's attendance
    const todayAttendance = filteredAttendance.filter(record => record.date === today);
    
    // Process attendance data
    const totalBuilders = studentCount?.length || 0;
    const presentCount = todayAttendance?.filter(r => r.status === 'present').length || 0;
    const lateCount = todayAttendance?.filter(r => r.status === 'late').length || 0;
    
    // Calculate attendance rate (present + late)
    const attendanceRate = totalBuilders > 0 
      ? Math.round(((presentCount + lateCount) / totalBuilders) * 100)
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
