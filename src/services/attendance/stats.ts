
import { supabase } from '@/integrations/supabase/client';

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
      .select('status')
      .eq('date', today);
      
    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      throw attendanceError;
    }
    
    // Process attendance data
    const totalBuilders = studentCount?.length || 0;
    const presentCount = attendanceData?.filter(r => r.status === 'present').length || 0;
    const lateCount = attendanceData?.filter(r => r.status === 'late').length || 0;
    
    // Calculate attendance rate (present + late)
    const attendanceRate = totalBuilders > 0 
      ? Math.round(((presentCount + lateCount) / totalBuilders) * 100)
      : 0;
      
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
