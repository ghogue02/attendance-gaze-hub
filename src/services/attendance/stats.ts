
import { supabase } from '@/integrations/supabase/client';

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');

// Define holidays - dates when we don't have class
const HOLIDAY_DATES = new Set([
  '2025-04-20' // Easter Sunday
]);

// Define problematic dates - Fridays we don't have class
const PROBLEMATIC_DATES = new Set([
  '2025-04-18', // Good Friday
  '2025-04-11', // Friday
  '2025-04-04'  // Friday
]);

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
    
    // Filter out records for Fridays, holidays, or problematic dates, or before MINIMUM_DATE
    const filteredAttendance = attendanceData?.filter(record => {
      const date = new Date(record.date);
      // Check if it's a Friday
      const isFriday = date.getDay() === 5;
      // Check if it's a problematic date
      const isProblematicDate = PROBLEMATIC_DATES.has(record.date);
      // Check if it's a holiday
      const isHoliday = HOLIDAY_DATES.has(record.date);
                           
      return !isFriday && !isProblematicDate && !isHoliday && date >= MINIMUM_DATE;
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
