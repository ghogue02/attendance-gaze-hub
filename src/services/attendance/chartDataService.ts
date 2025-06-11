
import { Builder } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const fetchAttendanceChartData = async (
  builders: Builder[],
  dateRange: { start: string; end: string }
) => {
  console.log(`[chartDataService] Using date range: ${dateRange.start} to ${dateRange.end}`);
  
  // If no builders are provided, return empty array
  if (!builders || builders.length === 0) {
    console.log('[chartDataService] No builders provided, returning empty array');
    return [];
  }

  // Extract builder IDs for filtering
  const builderIds = builders.map(b => b.id);
  
  console.log(`[chartDataService] Fetching attendance for ${builderIds.length} builders between ${dateRange.start} and ${dateRange.end}`);
  console.log(`[chartDataService] Builder IDs:`, builderIds);
  
  // Query with filters applied at the database level
  const { data: attendanceData, error } = await supabase
    .from('attendance')
    .select('*')
    .in('student_id', builderIds)
    .gte('date', dateRange.start)
    .lte('date', dateRange.end)
    .order('date', { ascending: true });
    
  if (error) {
    console.error('Error fetching historical attendance:', error);
    toast.error('Failed to load attendance history');
    throw error;
  }
  
  console.log('[chartDataService] Raw attendance data fetched for chart:', attendanceData?.length || 0, 'records');
  
  if (attendanceData && attendanceData.length > 0) {
    // Log sample records for debugging
    console.log('[chartDataService] Sample attendance records:', attendanceData.slice(0, 5));
    
    // Log unique dates found
    const uniqueDates = [...new Set(attendanceData.map(r => r.date))].sort();
    console.log('[chartDataService] Attendance found for dates:', uniqueDates);
  }
  
  return attendanceData || [];
};
