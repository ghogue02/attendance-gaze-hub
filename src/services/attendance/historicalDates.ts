
import { supabase } from '@/integrations/supabase/client';
import { processPendingAttendance } from './pendingAttendance';

// Process specific dates that had issues with absent marking
export const processSpecificDateIssues = async (): Promise<void> => {
  try {
    // These dates need to be processed for missing absences
    const specificDates = [
      { date: '2025-04-01', storageKey: 'april_1_2025_fix_applied' },
      { date: '2025-04-02', storageKey: 'april_2_2025_fix_applied' },
      { date: '2025-04-03', storageKey: 'april_3_2025_fix_applied' }
    ];
    
    for (const { date, storageKey } of specificDates) {
      // Only process if not already done
      if (!localStorage.getItem(storageKey)) {
        console.log(`[processSpecificDateIssues] Processing ${date}`);
        const result = await processPendingAttendance(date);
        
        if (result > 0) {
          console.log(`[processSpecificDateIssues] Fixed ${result} records for ${date}`);
        }
        
        // Mark as processed regardless of result
        localStorage.setItem(storageKey, 'true');
      }
    }
  } catch (error) {
    console.error('[processSpecificDateIssues] Error:', error);
  }
};
