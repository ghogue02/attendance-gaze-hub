
import { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord } from '@/components/dashboard/AttendanceTypes';
import { BuilderStatus } from '@/components/builder/types';
import { formatDate } from '@/utils/attendance/formatUtils';
import { fetchAttendanceRecords, deleteAttendanceRecord } from '@/services/attendanceHistoryService';
import { subscribeToAttendanceChanges } from '@/services/attendance';
import { toast } from 'sonner';

export const useAttendanceHistory = (onError: (message: string) => void) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const loadAttendanceHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log(`Loading attendance history with filters: date=${dateFilter}, status=${statusFilter}`);
      
      const records = await fetchAttendanceRecords(dateFilter, onError);
      
      let filteredRecords = records;
      if (statusFilter !== 'all') {
        filteredRecords = records.filter(record => record.status === statusFilter);
      }
      
      setAttendanceRecords(filteredRecords);
      console.log('Attendance history loaded with', filteredRecords.length, 'records');
    } catch (error) {
      console.error('Error loading attendance history:', error);
      onError('Failed to load attendance records');
    } finally {
      setIsLoading(false);
    }
  }, [onError, dateFilter, statusFilter]);
  
  useEffect(() => {
    console.log("Loading attendance history initially");
    loadAttendanceHistory();
    
    // Set up a subscription to attendance changes
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
    console.log('Closing delete dialog');
    setDeleteDialogOpen(false);
    setTimeout(() => {
      setRecordToDelete(null);
    }, 200);
  }, []);
  
  const confirmDelete = useCallback(async () => {
    if (!recordToDelete) {
      console.log("No record to delete");
      closeDeleteDialog();
      return;
    }
    
    setIsDeleting(true);
    try {
      // Store the ID before any state changes
      const idToDelete = recordToDelete.id;
      const recordName = recordToDelete.studentName || 'Unknown';
      
      console.log(`Attempting to delete record with ID: ${idToDelete}`);
      const success = await deleteAttendanceRecord(idToDelete, onError);
      
      if (success) {
        // Immediately update the local state to remove the deleted record
        setAttendanceRecords(prev => 
          prev.filter(record => record.id !== idToDelete)
        );
        
        toast.success(`Deleted attendance record for ${recordName}`);
        console.log('Record deleted successfully, local state updated');
        
        // Force a full reload to ensure all data is in sync with the database
        // after a delay to ensure the deletion has propagated
        setTimeout(() => {
          console.log('Executing delayed reload after deletion');
          loadAttendanceHistory();
        }, 1000);
      }
    } catch (error) {
      console.error('Error confirming delete:', error);
      onError('Failed to delete attendance record');
    } finally {
      setIsDeleting(false);
      closeDeleteDialog();
    }
  }, [recordToDelete, closeDeleteDialog, onError, loadAttendanceHistory]);

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
    refreshData: loadAttendanceHistory,
    isDeleting
  };
};
