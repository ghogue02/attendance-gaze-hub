
import { useState } from 'react';
import { BuilderStatus } from '@/components/builder/types';
import { markAttendance } from '@/utils/attendance/markAttendance';
import { toast } from 'sonner';

interface UseAttendanceOperationsProps {
  builders: any[];
  targetDateString: string;
  onAttendanceMarked: () => void;
}

export const useAttendanceOperations = ({
  builders,
  targetDateString,
  onAttendanceMarked
}: UseAttendanceOperationsProps) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleMarkAttendance = async (
    builderId: string,
    status: BuilderStatus,
    excuseReason?: string
  ) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(builderId);
      console.log(`Marking ${builderId} as ${status} for ${targetDateString}`);
      
      const success = await markAttendance(builderId, status, excuseReason, targetDateString);
      
      if (success) {
        const statusText = status === 'excused' ? 'excused absence' : status;
        toast.success(`Marked ${statusText} successfully`);
        
        // Refresh data after marking attendance
        if (onAttendanceMarked) {
          onAttendanceMarked();
        }
      } else {
        toast.error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Error updating attendance');
    } finally {
      setIsUpdating(null);
    }
  };

  return {
    isUpdating,
    handleMarkAttendance
  };
};
