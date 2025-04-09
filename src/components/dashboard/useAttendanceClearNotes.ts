
import { useState, useCallback } from 'react';
import { clearAutomatedNotesForPresentStudents } from '@/services/attendance';
import { toast } from 'sonner';

export const useAttendanceClearNotes = (
  onError: (message: string) => void,
  refreshData: () => void
) => {
  const [isClearing, setIsClearing] = useState(false);
  
  const handleClearAutomatedNotes = useCallback(async () => {
    setIsClearing(true);
    try {
      const result = await clearAutomatedNotesForPresentStudents();
      if (result > 0) {
        toast.success(`Cleared automated notes for ${result} students`);
        refreshData();
      } else {
        toast.info('No automated notes needed to be cleared');
      }
    } catch (e) {
      console.error('Error clearing automated notes:', e);
      onError('Failed to clear automated notes');
    } finally {
      setIsClearing(false);
    }
  }, [refreshData, onError]);

  return {
    isClearing,
    handleClearAutomatedNotes
  };
};
