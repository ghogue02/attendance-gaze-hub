
import { useState } from 'react';
import { toast } from 'sonner';
import { clearAutomatedNotesForPresentStudents } from '@/services/attendance/automatedNotes';

export const useAttendanceClearNotes = (
  onError: (message: string) => void,
  refreshData: () => void
) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAutomatedNotes = async () => {
    try {
      setIsClearing(true);
      const clearedCount = await clearAutomatedNotesForPresentStudents();
      
      if (clearedCount > 0) {
        toast.success(`Cleared automated notes for ${clearedCount} records`);
        refreshData();
      } else {
        toast.info('No automated notes found that needed clearing');
      }
    } catch (error) {
      console.error('Error clearing automated notes:', error);
      onError('Failed to clear automated notes');
    } finally {
      setIsClearing(false);
    }
  };

  return {
    isClearing,
    handleClearAutomatedNotes
  };
};
