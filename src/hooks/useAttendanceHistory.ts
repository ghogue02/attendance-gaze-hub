
import { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord } from '@/components/dashboard/AttendanceTypes';
import { BuilderStatus } from '@/components/builder/types';
import { formatDate } from '@/utils/attendance/formatUtils';
import { fetchAttendanceRecords, deleteAttendanceRecord } from '@/services/attendanceHistoryService';
import { subscribeToAttendanceChanges } from '@/services/attendance';

export const useAttendanceHistory = (onError: (message: string) => void) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  
  const loadAttendanceHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await fetchAttendanceRecords(dateFilter, onError);
      
      let filteredRecords = records;
      if (statusFilter !== 'all') {
        filteredRecords = records.filter(record => record.status === statusFilter);
      }
      
      setAttendanceRecords(filteredRecords);
      console.log('Attendance history loaded with', filteredRecords.length, 'records');
    } catch (error) {
      console.error('Error loading attendance history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onError, dateFilter, statusFilter]);
  
  useEffect(() => {
    loadAttendanceHistory();
    
    const unsubscribe = subscribeToAttendanceChanges(() => {
      console.log('Attendance changed, refreshing history from global subscription');
      loadAttendanceHistory();
    });
    
    return () => {
      unsubscribe();
    };
  }, [loadAttendanceHistory]);
  
  const handleDeleteRecord = useCallback((record: AttendanceRecord, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("Opening delete dialog for record:", record);
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  }, []);
  
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setTimeout(() => {
      setRecordToDelete(null);
    }, 100);
  }, []);
  
  const confirmDelete = useCallback(async () => {
    if (!recordToDelete) {
      console.log("No record to delete");
      closeDeleteDialog();
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await deleteAttendanceRecord(recordToDelete.id, onError);
      
      if (success) {
        setAttendanceRecords(prev => 
          prev.filter(record => record.id !== recordToDelete.id)
        );
        
        console.log('Record deleted successfully, local state updated');
      }
    } catch (error) {
      console.error('Error confirming delete:', error);
      onError('Failed to delete attendance record');
    } finally {
      setIsLoading(false);
      closeDeleteDialog();
    }
  }, [recordToDelete, closeDeleteDialog, onError]);

  return {
    attendanceRecords,
    isLoading,
    deleteDialogOpen,
    recordToDelete,
    dateFilter,
    statusFilter,
    setDateFilter,
    setStatusFilter,
    formatDate,
    handleDeleteRecord,
    confirmDelete,
    closeDeleteDialog,
    refreshData: loadAttendanceHistory
  };
};
