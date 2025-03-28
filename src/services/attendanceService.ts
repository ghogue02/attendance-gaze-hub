
import { supabase } from '@/integrations/supabase/client';

/**
 * Marks pending students as absent for a specific date
 * @param date ISO format date string (YYYY-MM-DD)
 * @returns Number of students marked as absent
 */
export const markPendingAsAbsent = async (date: string): Promise<number> => {
  try {
    console.log(`Checking for pending students on ${date} to mark as absent`);
    
    const { data: pendingAttendance, error: fetchError } = await supabase
      .from('attendance')
      .select('id, student_id')
      .eq('date', date)
      .eq('status', 'pending');
      
    if (fetchError) {
      console.error('Error fetching pending attendance:', fetchError);
      return 0;
    }
    
    if (!pendingAttendance || pendingAttendance.length === 0) {
      console.log('No pending attendance records found for date:', date);
      return 0;
    }
    
    console.log(`Found ${pendingAttendance.length} pending students to mark as absent`);
    
    const { error: updateError } = await supabase
      .from('attendance')
      .update({ 
        status: 'absent',
        time_recorded: new Date().toISOString(),
        notes: 'Automatically marked as absent (end of day)'
      })
      .in('id', pendingAttendance.map(record => record.id));
      
    if (updateError) {
      console.error('Error marking pending as absent:', updateError);
      return 0;
    }
    
    console.log(`Successfully marked ${pendingAttendance.length} students as absent`);
    return pendingAttendance.length;
  } catch (error) {
    console.error('Error in markPendingAsAbsent:', error);
    return 0;
  }
};

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
