import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Export a function to mark pending attendance records as absent for a specific date
export const markPendingAsAbsent = async (dateString: string): Promise<number> => {
  console.log(`[markPendingAsAbsent] Processing pending attendance for ${dateString}`);
  try {
    // 1. Find all students who have no attendance record or 'pending' status for the given date
    const { data: studentsWithoutAttendance, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .order('last_name');
    
    if (studentsError) {
      console.error(`[markPendingAsAbsent] Error fetching students:`, studentsError);
      return 0;
    }
    
    if (!studentsWithoutAttendance || studentsWithoutAttendance.length === 0) {
      console.log(`[markPendingAsAbsent] No students found in the database.`);
      return 0;
    }
    
    // 2. Get all attendance records for that date to compare
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('date', dateString);
    
    if (attendanceError) {
      console.error(`[markPendingAsAbsent] Error fetching attendance:`, attendanceError);
      return 0;
    }
    
    // 3. Create a map of student IDs with their attendance status
    const attendanceMap = new Map();
    attendanceRecords?.forEach(record => {
      attendanceMap.set(record.student_id, record.status);
    });
    
    // 4. Find students who need to be marked absent (no record or 'pending' status)
    const studentsToMarkAbsent = studentsWithoutAttendance.filter(student => {
      const status = attendanceMap.get(student.id);
      return !status || status === 'pending';
    });
    
    console.log(`[markPendingAsAbsent] Found ${studentsToMarkAbsent.length} students to mark as absent for ${dateString}`);
    
    if (studentsToMarkAbsent.length === 0) {
      return 0;
    }
    
    // 5. Create or update attendance records to 'absent'
    const currentTime = new Date().toISOString();
    const updates = studentsToMarkAbsent.map(student => ({
      student_id: student.id,
      date: dateString,
      status: 'absent',
      time_recorded: currentTime,
      notes: 'Automatically marked absent by system'
    }));
    
    // 6. Use upsert to create or update records
    const { error: updateError, data } = await supabase
      .from('attendance')
      .upsert(updates, {
        onConflict: 'student_id,date'
      });
    
    if (updateError) {
      console.error(`[markPendingAsAbsent] Error updating attendance:`, updateError);
      return 0;
    }
    
    console.log(`[markPendingAsAbsent] Successfully marked ${updates.length} students as absent for ${dateString}`);
    return updates.length;
    
  } catch (error) {
    console.error(`[markPendingAsAbsent] Unexpected error:`, error);
    return 0;
  }
};

// Process specific dates that had issues with absent marking
export const processSpecificDateIssues = async (): Promise<void> => {
  try {
    // These dates need to be processed for missing absences
    const specificDates = [
      { date: '2025-04-01', storageKey: 'april_1_2025_fix_applied' },
      { date: '2025-04-02', storageKey: 'april_2_2025_fix_applied' },
      { date: '2025-04-03', storageKey: 'april_3_2025_fix_applied' }
    ];
    
    for (const { date, storageKey } of specificDates) {
      // Only process if not already done
      if (!localStorage.getItem(storageKey)) {
        console.log(`[processSpecificDateIssues] Processing ${date}`);
        const result = await processPendingAttendance(date);
        
        if (result > 0) {
          console.log(`[processSpecificDateIssues] Fixed ${result} records for ${date}`);
        }
        
        // Mark as processed regardless of result
        localStorage.setItem(storageKey, 'true');
      }
    }
  } catch (error) {
    console.error('[processSpecificDateIssues] Error:', error);
  }
};

// Process pending attendance for a specific date
export const processPendingAttendance = async (dateString: string): Promise<number> => {
  console.log(`[processPendingAttendance] Processing attendance for ${dateString}`);
  try {
    // Find all attendance records for the date with 'pending' status
    const { data: pendingRecords, error: pendingError } = await supabase
      .from('attendance')
      .select('id, student_id')
      .eq('date', dateString)
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('[processPendingAttendance] Error fetching pending records:', pendingError);
      return 0;
    }
    
    if (!pendingRecords || pendingRecords.length === 0) {
      console.log(`[processPendingAttendance] No pending records found for ${dateString}`);
      
      // Also try to find students with no records and create absent records for them
      return await markPendingAsAbsent(dateString);
    }
    
    // Update pending records to absent
    const { error: updateError } = await supabase
      .from('attendance')
      .update({ 
        status: 'absent',
        time_recorded: new Date().toISOString(),
        notes: 'Automatically updated from pending to absent'
      })
      .in('id', pendingRecords.map(r => r.id));
    
    if (updateError) {
      console.error('[processPendingAttendance] Error updating pending records:', updateError);
      return 0;
    }
    
    console.log(`[processPendingAttendance] Updated ${pendingRecords.length} pending records to absent for ${dateString}`);
    return pendingRecords.length;
    
  } catch (error) {
    console.error('[processPendingAttendance] Error:', error);
    return 0;
  }
};

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

import { RealtimeChannel } from '@supabase/supabase-js';

let attendanceChannel: RealtimeChannel | null = null;

export const subscribeToAttendanceChanges = (callback: () => void) => {
  if (!supabase) {
    console.error('Supabase client is not initialized.');
    return () => {};
  }

  if (attendanceChannel) {
    console.log('Already subscribed to attendance changes, detaching previous subscription.');
    supabase.removeChannel(attendanceChannel);
    attendanceChannel = null;
  }

  attendanceChannel = supabase
    .channel('attendance_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'attendance' },
      (payload) => {
        console.log('Attendance change detected!', payload);
        callback();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to attendance changes.');
      } else {
        console.warn('Subscription status:', status);
      }
    });

  return () => {
    console.log('Unsubscribing from attendance changes.');
    if (attendanceChannel) {
      supabase.removeChannel(attendanceChannel);
      attendanceChannel = null;
    }
  };
};

// Process attendance for a specific date
export const processAttendanceForDate = async (dateString: string): Promise<number> => {
  console.log(`Processing attendance for ${dateString}`);
  try {
    // Find all attendance records for the date
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('id, student_id, status')
      .eq('date', dateString);
    
    if (attendanceError) {
      console.error('Error fetching attendance records:', attendanceError);
      return 0;
    }
    
    if (!attendanceRecords || attendanceRecords.length === 0) {
      console.log(`No attendance records found for ${dateString}`);
      return 0;
    }
    
    let updatedCount = 0;
    
    // Loop through each record and update if necessary
    for (const record of attendanceRecords) {
      if (record.status === 'pending') {
        // Update pending records to absent
        const { error: updateError } = await supabase
          .from('attendance')
          .update({ 
            status: 'absent',
            time_recorded: new Date().toISOString(),
            notes: 'Automatically updated from pending to absent'
          })
          .eq('id', record.id);
        
        if (updateError) {
          console.error('Error updating pending record:', updateError);
        } else {
          updatedCount++;
        }
      }
    }
    
    console.log(`Updated ${updatedCount} pending records to absent for ${dateString}`);
    return updatedCount;
    
  } catch (error) {
    console.error('Error processing attendance:', error);
    return 0;
  }
};
