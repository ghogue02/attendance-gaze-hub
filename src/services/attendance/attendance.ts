
import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { throttledRequest } from '@/utils/request/throttle';
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
import { TIMEZONE } from '@/utils/date/dateUtils';

// Mark attendance for a specific student
export const markAttendance = async (
  studentId: string,
  status: BuilderStatus,
  date: string,
  notes?: string
): Promise<boolean> => {
  try {
    // Check if attendance record already exists for this student on this date
    const { data: existingRecord, error: fetchError } = await supabase
      .from('attendance')
      .select('id, status, notes')
      .eq('student_id', studentId)
      .eq('date', date)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      // Real error, not just "no rows returned"
      console.error('Error checking existing attendance:', fetchError);
      return false;
    }
    
    // Get current timestamp in Eastern Time
    const now = new Date();
    const easternTime = utcToZonedTime(now, TIMEZONE);
    const easternTimeISO = now.toISOString();
    
    console.log(`Marking attendance for student ${studentId} on ${date} at ${formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd HH:mm:ss z')}`);
    
    // Clear automated "marked absent" notes when marking student as present
    const finalNotes = (status === 'present' || status === 'late' || status === 'excused') && 
                       existingRecord?.notes?.toLowerCase().includes('automatically marked') 
                         ? null 
                         : notes || existingRecord?.notes || null;
    
    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('attendance')
        .update({ 
          status, 
          time_recorded: easternTimeISO,
          notes: finalNotes
        })
        .eq('id', existingRecord.id);
        
      if (updateError) {
        console.error('Error updating attendance:', updateError);
        return false;
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          student_id: studentId,
          date,
          status,
          time_recorded: easternTimeISO,
          notes: finalNotes
        });
        
      if (insertError) {
        console.error('Error inserting attendance:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error marking attendance:', error);
    return false;
  }
};

/**
 * Batch mark attendance for multiple students
 * @param records Array of attendance records to mark
 * @returns Array of success/failure results
 */
export const batchMarkAttendance = async (
  records: {
    studentId: string;
    status: BuilderStatus;
    date: string;
    notes?: string;
  }[]
): Promise<boolean[]> => {
  try {
    // Group records by date to optimize database queries
    const recordsByDate = records.reduce((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = [];
      }
      acc[record.date].push(record);
      return acc;
    }, {} as Record<string, typeof records>);

    const results: boolean[] = [];

    // Get current timestamp in Eastern Time
    const now = new Date();
    const easternTimeISO = now.toISOString();
    console.log(`Batch marking attendance at ${formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd HH:mm:ss z')}`);

    // Process each date group
    for (const [date, dateRecords] of Object.entries(recordsByDate)) {
      // First, fetch all existing records for this date in one query
      const { data: existingRecords, error: fetchError } = await supabase
        .from('attendance')
        .select('id, student_id, status, notes')
        .eq('date', date)
        .in('student_id', dateRecords.map(r => r.studentId));

      if (fetchError) {
        console.error('Error fetching existing attendance records:', fetchError);
        // Add failure results for this batch
        results.push(...dateRecords.map(() => false));
        continue;
      }

      // Map existing records by student ID for easy lookup
      const existingRecordsMap = (existingRecords || []).reduce((acc, record) => {
        acc[record.student_id] = record;
        return acc;
      }, {} as Record<string, any>);

      // Prepare records to update and insert
      const recordsToUpdate = [];
      const recordsToInsert = [];

      for (const record of dateRecords) {
        const existing = existingRecordsMap[record.studentId];
        
        // Clear automated notes when marking present/excused/late
        const finalNotes = (record.status === 'present' || 
                            record.status === 'late' || 
                            record.status === 'excused') && 
                            existing?.notes?.toLowerCase().includes('automatically marked')
                              ? null
                              : record.notes || existing?.notes || null;

        if (existing) {
          recordsToUpdate.push({
            id: existing.id,
            status: record.status,
            time_recorded: easternTimeISO,
            notes: finalNotes
          });
        } else {
          recordsToInsert.push({
            student_id: record.studentId,
            date: record.date,
            status: record.status,
            time_recorded: easternTimeISO,
            notes: finalNotes
          });
        }
      }

      // Process updates in batch
      if (recordsToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from('attendance')
          .upsert(recordsToUpdate);

        if (updateError) {
          console.error('Error batch updating attendance:', updateError);
          results.push(...recordsToUpdate.map(() => false));
        } else {
          results.push(...recordsToUpdate.map(() => true));
        }
      }

      // Process inserts in batch
      if (recordsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('attendance')
          .insert(recordsToInsert);

        if (insertError) {
          console.error('Error batch inserting attendance:', insertError);
          results.push(...recordsToInsert.map(() => false));
        } else {
          results.push(...recordsToInsert.map(() => true));
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error in batch marking attendance:', error);
    return records.map(() => false);
  }
};

// Export other attendance-related functions
export { subscribeToAttendanceChanges } from './realtime';
export { deleteAttendanceRecordsByDate } from '@/services/attendanceHistoryService';
