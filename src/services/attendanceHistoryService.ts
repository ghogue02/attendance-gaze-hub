
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from '@/components/dashboard/AttendanceTypes';
import { BuilderStatus } from '@/components/builder/types';
import { toast } from 'sonner';

export const fetchAttendanceRecords = async (dateFilter: string | null, onError: (message: string) => void): Promise<AttendanceRecord[]> => {
  try {
    // Build the query with join to get student names
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
        students:student_id (
          id,
          first_name,
          last_name
        )
      `)
      .order('date', { ascending: false });
    
    // Apply date filter if it exists
    if (dateFilter) {
      query = query.eq('date', dateFilter);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching attendance records:', error);
      onError(`Error fetching attendance records: ${error.message}`);
      return [];
    }
    
    // Format the data to match our AttendanceRecord interface
    return data.map(record => {
      // Determine if this is an excused absence
      const isExcusedAbsence = record.status === 'absent' && record.excuse_reason;
      const status = isExcusedAbsence ? 'excused' : record.status;
      
      // Get student name from the joined students table
      const student = record.students as any;
      const studentName = student ? `${student.first_name} ${student.last_name}` : 'Unknown';
      
      // Ensure status is a valid BuilderStatus
      const validStatus: BuilderStatus = validateStatus(status);
      
      return {
        id: record.id,
        date: record.date,
        status: validStatus,
        timeRecorded: record.time_recorded ? new Date(record.time_recorded).toLocaleTimeString() : undefined,
        notes: record.notes,
        excuseReason: record.excuse_reason,
        studentId: record.student_id,
        studentName
      };
    });
  } catch (err) {
    console.error('Error in fetchAttendanceRecords:', err);
    onError('Failed to load attendance records');
    return [];
  }
};

// Function to validate and transform status strings to BuilderStatus
const validateStatus = (status: string): BuilderStatus => {
  const validStatuses: BuilderStatus[] = ['present', 'absent', 'excused', 'pending', 'late'];
  
  if (validStatuses.includes(status as BuilderStatus)) {
    return status as BuilderStatus;
  }
  
  // Default to 'pending' if the status is invalid
  console.warn(`Invalid status value encountered: ${status}. Defaulting to 'pending'`);
  return 'pending';
};

export const deleteAttendanceRecord = async (recordId: string, onError: (message: string) => void): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .match({ id: recordId });
      
    if (error) {
      console.error('Error deleting attendance record:', error);
      onError(`Failed to delete record: ${error.message}`);
      toast.error('Failed to delete attendance record');
      return false;
    }
    
    toast.success('Attendance record deleted');
    return true;
  } catch (err) {
    console.error('Error in deleteAttendanceRecord:', err);
    onError('Failed to delete attendance record');
    toast.error('Failed to delete attendance record');
    return false;
  }
};
