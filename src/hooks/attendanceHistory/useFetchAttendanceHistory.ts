
import { useState, useCallback } from 'react';
import { Builder, BuilderStatus, AttendanceRecord } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatISOTimeToEastern } from '@/utils/date/dateUtils';
import { isClassDaySync } from '@/utils/attendance/isClassDay';

export const useFetchAttendanceHistory = (builder: Builder) => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadAttendanceHistory = useCallback(async () => {
    if (!builder?.id) return;
    
    console.log(`Fetching attendance history for builder ${builder.id}`);
    setIsLoading(true);
    
    try {
      // First check if the builder is archived
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('archived_at')
        .eq('id', builder.id)
        .single();
        
      if (studentError) {
        console.error('Error checking student status:', studentError);
        toast.error('Failed to verify student status');
        return;
      }
      
      // If student is archived, don't fetch attendance history
      if (studentData.archived_at) {
        console.log(`Student ${builder.id} is archived, no attendance history will be shown`);
        setAttendanceHistory([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('attendance')
        .select('id, date, status, time_recorded, notes, excuse_reason')
        .eq('student_id', builder.id)
        .order('date', { ascending: false });
        
      if (error) {
        console.error('Error fetching attendance history:', error);
        toast.error('Failed to fetch attendance history');
        return;
      }
      
      if (data) {
        // Filter records to only include valid class days using synchronous function
        const filteredData = data.filter(record => isClassDaySync(record.date));
        console.log(`Filtered ${data.length} records to ${filteredData.length} valid class days for ${builder.name}`);
        
        const formattedHistory = filteredData.map(record => ({
          id: record.id,
          date: record.date,
          status: record.status as BuilderStatus,
          // Format time to Eastern Time
          timeRecorded: record.time_recorded ? formatISOTimeToEastern(record.time_recorded) : '',
          notes: record.notes || '',
          excuseReason: record.excuse_reason || ''
        }));
        
        setAttendanceHistory(formattedHistory);
      }
    } catch (err) {
      console.error('Unexpected error fetching attendance history:', err);
      toast.error('An unexpected error occurred while loading attendance history');
    } finally {
      setIsLoading(false);
    }
  }, [builder.id]);

  return { attendanceHistory, isLoading, setAttendanceHistory, loadAttendanceHistory };
};
