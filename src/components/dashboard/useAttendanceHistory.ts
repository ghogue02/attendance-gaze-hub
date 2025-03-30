
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from './AttendanceTypes';
import { BuilderStatus } from '@/components/builder/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MINIMUM_DATE = new Date('2025-03-15');

export const useAttendanceHistory = (onError: (message: string) => void) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  
  const fetchAttendanceHistory = useCallback(async () => {
    setIsLoading(true);
    try {
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
        setIsLoading(false);
        return;
      }
      
      const filteredData = data.filter(record => {
        const date = new Date(record.date);
        return date >= MINIMUM_DATE;
      });
      
      const formattedRecords: AttendanceRecord[] = filteredData.map(record => {
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
      
      setAttendanceRecords(formattedRecords);
    } catch (error) {
      console.error('Error in fetchAttendanceHistory:', error);
      onError('An error occurred while loading attendance history');
    } finally {
      setIsLoading(false);
    }
  }, [onError, dateFilter]);
  
  useEffect(() => {
    fetchAttendanceHistory();
    
    const channel = supabase
      .channel('history-attendance-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance' }, 
        () => {
          console.log('Attendance changed, refreshing history');
          fetchAttendanceHistory();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAttendanceHistory]);
  
  const formatDate = useCallback((dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      
      const date = new Date(year, month, day);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateStr;
    }
  }, []);
  
  const handleDeleteRecord = (record: AttendanceRecord, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("Opening delete dialog for record:", record);
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };
  
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    // Use a small timeout to ensure React completes the state update before clearing the record
    setTimeout(() => {
      setRecordToDelete(null);
    }, 100);
  };
  
  const confirmDelete = async () => {
    if (!recordToDelete) {
      console.log("No record to delete");
      closeDeleteDialog();
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Deleting record:", recordToDelete);
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', recordToDelete.id);

      if (error) {
        console.error('Error deleting attendance record:', error);
        onError('Failed to delete attendance record');
        closeDeleteDialog();
        return;
      }
      
      // Update local state after successful deletion
      setAttendanceRecords(prev => 
        prev.filter(record => record.id !== recordToDelete.id)
      );
      
      toast.success('Attendance record deleted');
    } catch (error) {
      console.error('Error in deleteAttendanceRecord:', error);
      onError('Error deleting attendance record');
    } finally {
      setIsLoading(false);
      closeDeleteDialog();
    }
  };

  return {
    attendanceRecords,
    isLoading,
    deleteDialogOpen,
    recordToDelete,
    dateFilter,
    setDateFilter,
    formatDate,
    handleDeleteRecord,
    confirmDelete,
    closeDeleteDialog
  };
};
