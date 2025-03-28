
import { useCallback } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { markAttendance } from '@/utils/attendance';
import { toast } from 'sonner';

interface AttendanceParams {
  builders: Builder[];
  targetDateString: string;
  onAttendanceMarked: () => void;
}

/**
 * Hook to manage attendance marking operations
 */
export const useAttendanceOperations = ({ 
  builders, 
  targetDateString,
  onAttendanceMarked 
}: AttendanceParams) => {
  
  // Handler for marking attendance
  const handleMarkAttendance = useCallback(async (builderId: string, status: BuilderStatus, excuseReason?: string) => {
    console.log(`[useAttendanceOperations] handleMarkAttendance called for ${builderId} with status ${status} for date ${targetDateString}`);
    const originalBuilders = [...builders];
    
    try {
      const newStatus = (status === 'absent' && excuseReason) ? 'excused' : status;
      const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const newExcuse = (newStatus === 'excused') ? (excuseReason || originalBuilders.find(b => b.id === builderId)?.excuseReason) : undefined;

      // Explicitly pass the current date to markAttendance to ensure correct date recording
      const success = await markAttendance(builderId, status, excuseReason, targetDateString);

      if (success) {
        const statusText = newStatus === 'excused' ? 'Excused absence recorded' : `Attendance marked as ${newStatus}`;
        toast.success(statusText);
        // Call the callback to trigger data reload
        onAttendanceMarked();
      } else {
        toast.error('Failed to save attendance update to database');
      }
    } catch (error) {
      console.error('[useAttendanceOperations] Error marking attendance:', error);
      toast.error('An error occurred while updating attendance');
    }
  }, [builders, targetDateString, onAttendanceMarked]);

  return {
    handleMarkAttendance
  };
};
