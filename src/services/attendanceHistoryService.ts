
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from '@/components/dashboard/AttendanceTypes';
import { BuilderStatus } from '@/components/builder/types';
import { toast } from 'sonner';

/**
 * Fetches all attendance records with student names
 */
export const fetchAttendanceRecords = async (
  dateFilter: string | null, 
  onError: (message: string) => void
): Promise<AttendanceRecord[]> => {
  try {
    let query = supabase
      .from('attendance')
      .select(`
        id, 
        date, 
        status, 
        time_recorded, 
        notes, 
        excuse_reason, 
        student_id,
        students(first_name, last_name)
      `)
      .order('date', { ascending: false })
      .order('time_recorded', { ascending: false });
    
    if (dateFilter) {
      query = query.eq('date', dateFilter);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching attendance records:', error.message);
      onError(`Failed to fetch attendance history: ${error.message}`);
      return [];
    }
    
    // Filter out April 11 and April 4, 2025 records directly in the client-side code
    const filteredData = data.filter(record => 
      record.date !== '2025-04-11' && record.date !== '2025-04-04'
    );
    
    // Map and validate the status to ensure it's a valid BuilderStatus
    return filteredData.map(record => {
      // Get first and last name from the joined students data
      const student = record.students as { first_name: string, last_name: string } | null;
      const studentName = student ? `${student.first_name} ${student.last_name}`.trim() : 'Unknown';
      
      // Ensure status is a valid BuilderStatus
      const status = validateStatus(record.status);
      
      return {
        id: record.id,
        date: record.date,
        status: status,
        timeRecorded: record.time_recorded ? new Date(record.time_recorded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        notes: record.notes || '',
        excuseReason: record.excuse_reason || '',
        studentId: record.student_id,
        studentName: studentName
      };
    });
  } catch (error) {
    console.error('Unexpected error fetching attendance records:', error);
    onError('An unexpected error occurred while fetching attendance history');
    return [];
  }
};

// Helper function to validate status
const validateStatus = (status: string): BuilderStatus => {
  const validStatuses: BuilderStatus[] = ['present', 'absent', 'excused', 'pending', 'late'];
  return validStatuses.includes(status as BuilderStatus) 
    ? status as BuilderStatus 
    : 'pending';
};

/**
 * Deletes an attendance record
 */
export const deleteAttendanceRecord = async (
  recordId: string, 
  onError: (message: string) => void
): Promise<boolean> => {
  try {
    console.log(`Attempting to delete attendance record with ID: ${recordId}`);
    
    // First check if the record exists - this avoids race conditions
    const { data: existingRecord, error: checkError } = await supabase
      .from('attendance')
      .select('id')
      .eq('id', recordId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking attendance record:', checkError.message);
      onError(`Failed to verify attendance record: ${checkError.message}`);
      return false;
    }
    
    if (!existingRecord) {
      console.error('Record not found:', recordId);
      onError(`Attendance record not found: ${recordId}`);
      return false;
    }
    
    // Perform the delete operation - don't try to select count or anything else
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('id', recordId);
    
    if (deleteError) {
      console.error('Error deleting attendance record:', deleteError.message);
      onError(`Failed to delete attendance record: ${deleteError.message}`);
      return false;
    }
    
    console.log(`Successfully deleted attendance record with ID: ${recordId}`);
    return true;
  } catch (error) {
    console.error('Unexpected error deleting attendance record:', error);
    onError('An unexpected error occurred while deleting the attendance record');
    return false;
  }
};

/**
 * Deletes all attendance records for a specific date
 */
export const deleteAttendanceRecordsByDate = async (
  dateString: string,
  onError: (message: string) => void
): Promise<boolean> => {
  try {
    console.log(`[deleteAttendanceRecordsByDate] Attempting to delete all attendance records for date: ${dateString}`);
    
    // First check if records exist for this date
    const { data: existingRecords, error: checkError } = await supabase
      .from('attendance')
      .select('id')
      .eq('date', dateString);
    
    if (checkError) {
      console.error('[deleteAttendanceRecordsByDate] Error checking attendance records:', checkError.message);
      onError(`Failed to verify attendance records: ${checkError.message}`);
      return false;
    }
    
    if (!existingRecords || existingRecords.length === 0) {
      console.warn(`[deleteAttendanceRecordsByDate] No attendance records found for date: ${dateString}`);
      return true; // Nothing to delete, so technically successful
    }
    
    console.log(`[deleteAttendanceRecordsByDate] Found ${existingRecords.length} records to delete for date: ${dateString}`);
    
    // Perform the delete operation for all records with the matching date
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('date', dateString);
    
    if (deleteError) {
      console.error('[deleteAttendanceRecordsByDate] Error deleting attendance records:', deleteError.message);
      onError(`Failed to delete attendance records: ${deleteError.message}`);
      return false;
    }
    
    console.log(`[deleteAttendanceRecordsByDate] Successfully deleted ${existingRecords.length} attendance records for date: ${dateString}`);
    return true;
  } catch (error) {
    console.error('[deleteAttendanceRecordsByDate] Unexpected error:', error);
    onError('An unexpected error occurred while deleting attendance records');
    return false;
  }
};
