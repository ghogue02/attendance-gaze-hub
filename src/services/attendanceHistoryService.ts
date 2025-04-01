
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from '@/components/dashboard/AttendanceTypes';
import { BuilderStatus } from '@/components/builder/types';
import { toast } from 'sonner';

const MINIMUM_DATE = new Date('2025-03-15');

/**
 * Fetches attendance history records from the database
 */
export const fetchAttendanceRecords = async (
  dateFilter: string | null,
  onError: (message: string) => void
): Promise<AttendanceRecord[]> => {
  try {
    console.log('Fetching attendance records with date filter:', dateFilter);
    // Build query
    let query = supabase
      .from('attendance')
      .select(`
        id, 
        date, 
        status, 
        time_recorded, 
        notes, 
        excuse_reason,
        students(id, first_name, last_name, student_id)
      `)
      .neq('status', 'pending')
      .order('date', { ascending: false })
      .order('time_recorded', { ascending: false });
      
    // Add date filter if selected
    if (dateFilter) {
      query = query.eq('date', dateFilter);
    }
    
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching attendance history:', error);
      onError('Failed to load attendance history');
      return [];
    }
    
    // Filter by minimum date
    const filteredData = data.filter(record => {
      const date = new Date(record.date);
      return date >= MINIMUM_DATE;
    });
    
    console.log(`Fetched ${filteredData.length} attendance records after filtering`);
    
    // Format records
    return mapAttendanceRecords(filteredData);
  } catch (error) {
    console.error('Error in fetchAttendanceHistory:', error);
    onError('An error occurred while loading attendance history');
    return [];
  }
};

/**
 * Maps raw database records to AttendanceRecord objects
 */
const mapAttendanceRecords = (records: any[]): AttendanceRecord[] => {
  return records.map(record => {
    const student = record.students;
    const fullName = `${student.first_name} ${student.last_name || ''}`.trim();
    
    let statusDisplay: BuilderStatus = 'absent';
    
    if (record.status === 'present') {
      statusDisplay = 'present';
    } else if (record.status === 'late') {
      statusDisplay = 'late';
    } else if (record.status === 'pending') {
      statusDisplay = 'pending';
    } else if (record.status === 'absent') {
      statusDisplay = record.excuse_reason ? 'excused' : 'absent';
    } else if (record.status === 'excused') {
      statusDisplay = 'excused';
    }
    
    return {
      id: record.id,
      date: record.date,
      studentName: fullName,
      studentId: student.student_id || '',
      status: statusDisplay,
      timeRecorded: record.time_recorded ? new Date(record.time_recorded).toLocaleTimeString() : null,
      notes: record.notes,
      excuseReason: record.excuse_reason
    };
  });
};

/**
 * Deletes an attendance record from the database
 */
export const deleteAttendanceRecord = async (
  recordId: string,
  onError: (message: string) => void
): Promise<boolean> => {
  try {
    console.log('Deleting attendance record:', recordId);
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', recordId);

    if (error) {
      console.error('Error deleting attendance record:', error);
      onError('Failed to delete attendance record');
      return false;
    }
    
    toast.success('Attendance record deleted');
    console.log('Successfully deleted attendance record from database');
    return true;
  } catch (error) {
    console.error('Error in deleteAttendanceRecord:', error);
    onError('Error deleting attendance record');
    return false;
  }
};
