
import { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord } from '@/components/dashboard/AttendanceTypes';
import { BuilderStatus } from '@/components/builder/types';
import { formatDate } from '@/utils/attendance/formatUtils';
import { fetchAttendanceRecords, deleteAttendanceRecord } from '@/services/attendanceHistoryService';
import { subscribeToAttendanceChanges } from '@/services/attendanceService';

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
      
      // Apply status filter
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
    
    // Subscribe to global attendance changes
    const unsubscribe = subscribeToAttendanceChanges(() => {
      console.log('Attendance changed, refreshing history from global subscription');
      loadAttendanceHistory();
    });
    
    return () => {
      unsubscribe();
    };
  }, [loadAttendanceHistory]);
  
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
      const success = await deleteAttendanceRecord(recordToDelete.id, onError);
      
      if (success) {
        // Immediately update local state after successful deletion
        setAttendanceRecords(prev => 
          prev.filter(record => record.id !== recordToDelete.id)
        );
        
        // The global attendance subscription will trigger a refresh as well
        console.log('Record deleted successfully, local state updated');
      }
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
    statusFilter,
    setDateFilter,
    setStatusFilter,
    formatDate,
    handleDeleteRecord,
    confirmDelete,
    closeDeleteDialog,
    refreshData: loadAttendanceHistory // Expose refresh function
  };
};
