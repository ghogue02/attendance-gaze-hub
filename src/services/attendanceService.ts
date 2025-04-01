
import { supabase } from '@/integrations/supabase/client';
import { markPendingAsAbsent } from '@/utils/attendance/processing/pendingProcessor';

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

/**
 * Processes attendance for a specific date, marking pending as absent
 * @param dateString The date to process in YYYY-MM-DD format
 * @returns Promise with the number of records processed
 */
export const processAttendanceForDate = async (dateString: string): Promise<number> => {
  console.log(`Processing attendance records for ${dateString}`);
  try {
    return await markPendingAsAbsent(dateString);
  } catch (error) {
    console.error(`Error processing attendance for ${dateString}:`, error);
    return 0;
  }
};

/**
 * Creates a Supabase subscription for attendance changes
 * @param callback Function to call when attendance changes
 * @returns Cleanup function to remove the subscription
 */
export const subscribeToAttendanceChanges = (callback: () => void) => {
  console.log('Setting up attendance subscription');
  
  // Use a channel name that includes a timestamp to ensure a unique channel each time
  const channelName = `attendance-changes-${Date.now()}`;
  
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'attendance' }, 
      (payload) => {
        // Type-safe approach to accessing id - check if properties exist first
        let recordId: string | undefined;
        
        if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
          recordId = payload.new.id as string;
        } else if (payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
          recordId = payload.old.id as string;
        }
        
        console.log('Attendance change detected:', payload.eventType, 'for record:', recordId || 'unknown');
        callback();
      }
    )
    .subscribe((status) => {
      console.log(`Attendance subscription status: ${status}`);
    });
  
  // Return cleanup function
  return () => {
    console.log('Cleaning up attendance subscription');
    supabase.removeChannel(channel);
  };
};

// Re-export the attendance marking utility since it's used in the frontend
export { markPendingAsAbsent };
