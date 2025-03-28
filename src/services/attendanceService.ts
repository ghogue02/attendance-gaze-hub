
import { supabase } from '@/integrations/supabase/client';
import { markPendingAsAbsent } from '@/utils/attendance';

/**
 * Fetches statistics about students and attendance
 * @returns Object containing total builders and attendance rate
 */
export const fetchStats = async () => {
  try {
    const { count: totalBuilders, error: buildersError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
      
    if (buildersError) {
      console.error('Error fetching builders count:', buildersError);
      return { totalBuilders: 0, attendanceRate: 0 };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', today);
      
    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return { totalBuilders: totalBuilders || 0, attendanceRate: 0 };
    }
    
    const presentCount = attendanceData?.filter(record => 
      record.status === 'present'
    ).length || 0;
    
    const attendanceRate = totalBuilders ? 
      Math.round((presentCount / totalBuilders) * 100) : 0;
      
    console.log('Stats updated:', {
      totalBuilders,
      presentCount,
      attendanceRate
    });
      
    return {
      totalBuilders: totalBuilders || 0,
      attendanceRate
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { totalBuilders: 0, attendanceRate: 0 };
  }
};

// Re-export the attendance marking utility since it's used in the frontend
export { markPendingAsAbsent };
