
import { useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import { useFetchAttendanceHistory } from './attendanceHistory/useFetchAttendanceHistory';
import { useEditAttendance } from './attendanceHistory/useEditAttendance';
import { useAttendanceDates } from './attendanceHistory/useAttendanceDates';
import { useDeleteAttendance } from './attendanceHistory/useDeleteAttendance';

interface UseAttendanceHistoryProps {
  builder: Builder;
  isOpen: boolean;
}

export const useAttendanceHistoryState = ({ builder, isOpen }: UseAttendanceHistoryProps) => {
  // Compose the smaller hooks
  const { 
    attendanceHistory, 
    isLoading: isFetching, 
    setAttendanceHistory, 
    loadAttendanceHistory 
  } = useFetchAttendanceHistory(builder);
  
  const {
    editingRecord,
    editingDate,
    editStatus,
    editExcuseReason,
    editNotes,
    isLoading: isEditing,
    setEditStatus,
    setEditExcuseReason,
    setEditNotes,
    startEditing,
    startEditingDate,
    cancelEditing,
    cancelEditingDate,
    saveAttendanceChanges
  } = useEditAttendance({ setAttendanceHistory });
  
  const {
    isLoading: isDateProcessing,
    saveAttendanceDateChange,
    addNewAttendanceRecord
  } = useAttendanceDates({ builder, loadAttendanceHistory });
  
  const {
    deleteDialogOpen,
    recordToDelete,
    isLoading: isDeleting,
    setDeleteDialogOpen,
    handleDeleteRecord,
    confirmDelete
  } = useDeleteAttendance({ setAttendanceHistory });
  
  // Combined loading state
  const isLoading = isFetching || isEditing || isDateProcessing || isDeleting;
  
  // Load history when the dialog opens
  useEffect(() => {
    if (isOpen) {
      loadAttendanceHistory();
    }
  }, [isOpen, loadAttendanceHistory]);
  
  return {
    // Data
    attendanceHistory,
    isLoading,
    
    // Edit states
    editingRecord,
    editingDate,
    editStatus,
    editExcuseReason,
    editNotes,
    
    // Delete states
    deleteDialogOpen,
    recordToDelete,
    
    // Edit functions
    startEditing,
    startEditingDate,
    cancelEditing,
    cancelEditingDate,
    saveAttendanceChanges,
    setEditStatus,
    setEditExcuseReason,
    setEditNotes,
    
    // Date functions
    saveAttendanceDateChange,
    addNewAttendanceRecord,
    
    // Delete functions
    handleDeleteRecord,
    confirmDelete,
    setDeleteDialogOpen
  };
};
