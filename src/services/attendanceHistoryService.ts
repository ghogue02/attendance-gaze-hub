
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
    
    // Map and validate the status to ensure it's a valid BuilderStatus
    return data.map(record => {
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
    
    // First, perform the delete operation without returning count
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', recordId);
    
    if (error) {
      console.error('Error deleting attendance record:', error.message);
      onError(`Failed to delete attendance record: ${error.message}`);
      toast.error(`Failed to delete record: ${error.message}`);
      return false;
    }
    
    // Now verify the deletion by checking if the record still exists
    const { data, error: checkError } = await supabase
      .from('attendance')
      .select('id')
      .eq('id', recordId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is what we want
      console.warn('Error verifying deletion:', checkError.message);
    }
    
    const wasDeleted = !data; // If data is null, deletion was successful
    console.log(`Deletion verification: Record ${wasDeleted ? 'was' : 'was NOT'} deleted`);
    
    if (!wasDeleted) {
      console.warn('Record may not have been deleted, ID might still exist');
      toast.warning('Could not verify if the record was deleted');
      return false;
    }
    
    toast.success('Attendance record deleted successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error deleting attendance record:', error);
    onError('An unexpected error occurred while deleting the attendance record');
    toast.error('An unexpected error occurred while deleting the record');
    return false;
  }
};
