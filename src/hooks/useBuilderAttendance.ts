// hooks/useBuilderAttendance.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from '@/components/builder/types';

interface UseBuilderAttendanceHistoryReturn {
  history: AttendanceRecord[];
  isLoading: boolean;
  error: Error | null;
}

export const useBuilderAttendance = (builderId: string | null, isHistoryDialogOpen: boolean): UseBuilderAttendanceHistoryReturn => {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only run if enabled and builderId is provided
    if (!isHistoryDialogOpen || !builderId) {
       // Reset if disabled or no ID
       setHistory([]);
       setIsLoading(false);
       setError(null);
       return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      console.log(`[useBuilderAttendance] Fetching history for ${builderId}`);
      try {
        const { data, error: dbError } = await supabase
          .from('attendance')
          .select('*') // Select all needed fields for the history dialog
          .eq('student_id', builderId)
          .order('date', { ascending: false }); // Or true, depending on desired order

        if (dbError) throw dbError;

        // Map Supabase data structure if needed
        const formattedHistory: AttendanceRecord[] = (data || []).map(record => ({
           id: record.id, // Ensure you have an ID column or use date/builderId combo
           date: record.date,
           status: record.status,
           timeRecorded: record.time_recorded, // Adjust column names
           excuseReason: record.excuse_reason,
           notes: record.notes
         }));

        setHistory(formattedHistory);

      } catch (err) {
        console.error(`[useBuilderAttendance] Error fetching history for ${builderId}:`, err);
        setError(err instanceof Error ? err : new Error('Failed to load history'));
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [builderId, isHistoryDialogOpen]); // Re-run if builderId or isHistoryDialogOpen status changes

  // ONLY return history, loading, error. NO RATE.
  return { history, isLoading, error };
};