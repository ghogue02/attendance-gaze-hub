
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
        // Type-safe approach for accessing id
        let recordId: string | undefined;
        
        // Check if new payload exists and has id
        if (payload.new && 
            typeof payload.new === 'object' && 
            payload.new !== null && 
            'id' in payload.new && 
            payload.new.id) {
          recordId = String(payload.new.id);
        } 
        // Check if old payload exists and has id
        else if (payload.old && 
                typeof payload.old === 'object' && 
                payload.old !== null && 
                'id' in payload.old && 
                payload.old.id) {
          recordId = String(payload.old.id);
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

/**
 * Manually triggers the process of marking pending students as absent
 * This can be called to mark all pending students as absent for a specific date
 * @param dateString Optional date string in YYYY-MM-DD format, defaults to today
 * @returns Promise with the number of records processed
 */
export const processPendingAttendance = async (dateString?: string): Promise<number> => {
  // Use provided date or default to today
  const date = dateString || new Date().toISOString().split('T')[0];
  console.log(`Manually processing pending attendance for ${date}`);
  return await markPendingAsAbsent(date);
};

/**
 * Process specific dates that had issues with attendance marking
 * @returns Promise resolved when all processing is complete
 */
export const processSpecificDateIssues = async (): Promise<void> => {
  // Add specific dates that need to be reprocessed
  const problemDates = [
    { date: '2025-03-29', storageKey: 'fix_applied_march_29_2025' },
    { date: '2025-03-30', storageKey: 'fix_applied_march_30_2025' },
    { date: '2025-03-31', storageKey: 'fix_applied_march_31_2025' }  // Added March 31
  ];
  
  for (const { date, storageKey } of problemDates) {
    // Check if we've already processed this date
    if (!localStorage.getItem(storageKey)) {
      console.log(`Processing problem date: ${date}`);
      const count = await processAttendanceForDate(date);
      console.log(`Processed ${count} records for ${date}`);
      
      // Mark as processed
      localStorage.setItem(storageKey, 'true');
    }
  }
};

// Re-export the attendance marking utility since it's used in the frontend
export { markPendingAsAbsent };
