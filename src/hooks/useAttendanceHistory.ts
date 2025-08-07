
import { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord } from '@/components/dashboard/AttendanceTypes';
import { BuilderStatus } from '@/components/builder/types';
import { formatDate } from '@/utils/attendance/formatUtils';
import { fetchAttendanceRecords, deleteAttendanceRecord } from '@/services/attendanceHistoryService';
import { subscribeToAttendanceChanges } from '@/services/attendance/realtime';
import { toast } from 'sonner';
import { throttledRequest } from '@/utils/request/throttle';
import { isClassDaySync } from '@/utils/attendance/isClassDay';
import { CohortName } from '@/types/cohort';

export const useAttendanceHistory = (onError: (message: string) => void, selectedCohort: CohortName) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  
  const loadAttendanceHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log(`Loading attendance history with filters: date=${dateFilter}, status=${statusFilter}`);
      
      // Use throttled request for records
      const records = await throttledRequest(
        `attendance_history_${dateFilter || 'all'}_${selectedCohort}`,
        () => fetchAttendanceRecords(dateFilter, onError, selectedCohort),
        60000 // 1 minute cache
      );
      
      // Filter out records for non-class days using synchronous function
      const classDayRecords = records.filter(record => isClassDaySync(record.date));
      console.log(`Filtered ${records.length} records to ${classDayRecords.length} valid class days`);
      
      let filteredRecords = classDayRecords;
      if (statusFilter !== 'all') {
        filteredRecords = classDayRecords.filter(record => record.status === statusFilter);
      }
      
      setAttendanceRecords(filteredRecords);
      console.log('Attendance history loaded with', filteredRecords.length, 'records');
    } catch (error) {
      console.error('Error loading attendance history:', error);
      onError('Failed to load attendance records');
    } finally {
      setIsLoading(false);
    }
  }, [onError, dateFilter, statusFilter, selectedCohort]);
  
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
    // Use setTimeout to avoid state updates during render
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
      // Store the ID and record info before any state changes
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
        closeDeleteDialog();
        
        // After a short delay, reload to ensure consistency with the database
        setTimeout(() => {
          loadAttendanceHistory();
        }, 500);
      } else {
        // If deletion failed, keep dialog open to allow retry
        toast.error('Failed to delete record');
      }
    } catch (error) {
      console.error('Error confirming delete:', error);
      onError('Failed to delete attendance record');
    } finally {
      setIsLoading(false);
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
    refreshData: loadAttendanceHistory
  };
};
