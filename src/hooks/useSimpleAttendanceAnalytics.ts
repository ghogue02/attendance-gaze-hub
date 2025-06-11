
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/builder/types';
import { toast } from 'sonner';
import { isClassDay, getCancelledDays } from '@/utils/attendance/isClassDay';

export interface AttendanceAnalytics {
  daily: Array<{
    date: string;
    present: number;
    late: number;
    absent: number;
    excused: number;
    total: number;
  }>;
  summary: {
    totalPresent: number;
    totalLate: number;
    totalAbsent: number;
    totalExcused: number;
    totalRecords: number;
  };
}

export const useSimpleAttendanceAnalytics = (builders: Builder[], days: number) => {
  const [data, setData] = useState<AttendanceAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Prevent multiple concurrent requests
  const requestInProgress = useRef(false);
  
  // Memoize builder IDs to prevent unnecessary re-renders
  const builderIds = useMemo(() => {
    return builders.map(b => b.id);
  }, [builders]);
  
  // Memoize date range calculation
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  }, [days]);

  useEffect(() => {
    console.log(`[Analytics] Time frame changed to ${days} days, resetting request state`);
    
    // Reset request state when time frame changes
    requestInProgress.current = false;
    setIsLoading(true);
    setError(null);
    
    const fetchAnalytics = async () => {
      // Prevent concurrent requests
      if (requestInProgress.current) {
        console.log('[Analytics] Request already in progress, skipping');
        return;
      }

      // Skip if no builders
      if (builderIds.length === 0) {
        console.log('[Analytics] No builders, setting empty data');
        setData({
          daily: [],
          summary: { totalPresent: 0, totalLate: 0, totalAbsent: 0, totalExcused: 0, totalRecords: 0 }
        });
        setIsLoading(false);
        return;
      }

      requestInProgress.current = true;
      
      try {
        console.log(`[Analytics] Fetching data for ${builderIds.length} builders over ${days} days`);
        console.log(`[Analytics] Date range: ${dateRange.start} to ${dateRange.end}`);
        console.log(`[Analytics] Builder IDs sample:`, builderIds.slice(0, 5));

        // CRITICAL: Ensure cancelled days are loaded before ANY processing
        console.log('[Analytics] Pre-loading cancelled days...');
        const cancelledDays = await getCancelledDays();
        console.log(`[Analytics] Loaded ${cancelledDays.size} cancelled days:`, Array.from(cancelledDays));

        // Fetch attendance data with better error handling
        const { data: attendanceData, error: fetchError } = await supabase
          .from('attendance')
          .select('date, status, student_id, excuse_reason')
          .in('student_id', builderIds)
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .order('date', { ascending: true });

        if (fetchError) {
          throw new Error(`Failed to fetch attendance data: ${fetchError.message}`);
        }

        console.log(`[Analytics] Found ${attendanceData?.length || 0} raw attendance records`);
        
        if (attendanceData && attendanceData.length > 0) {
          // Log sample records for debugging
          console.log('[Analytics] Sample attendance records:', attendanceData.slice(0, 5));
          
          // Group by date for debugging
          const recordsByDate = attendanceData.reduce((acc, record) => {
            if (!acc[record.date]) acc[record.date] = [];
            acc[record.date].push(record);
            return acc;
          }, {} as Record<string, any[]>);
          
          console.log('[Analytics] Records by date:', Object.keys(recordsByDate).map(date => ({
            date,
            count: recordsByDate[date].length,
            statuses: recordsByDate[date].reduce((acc, r) => {
              acc[r.status] = (acc[r.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          })));
        }

        // Initialize date map with async class day checking
        const dailyMap = new Map<string, { present: number; late: number; absent: number; excused: number; total: number }>();
        let totalPresent = 0, totalLate = 0, totalAbsent = 0, totalExcused = 0;

        // Generate all dates in range and check each one individually
        const startDateObj = new Date(dateRange.start);
        const endDateObj = new Date(dateRange.end);
        
        console.log(`[Analytics] Checking dates from ${dateRange.start} to ${dateRange.end}`);
        
        for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          
          // Use async class day logic with proper error handling
          try {
            const isValidClassDay = await isClassDay(dateStr);
            if (isValidClassDay) {
              dailyMap.set(dateStr, { present: 0, late: 0, absent: 0, excused: 0, total: 0 });
              console.log(`[Analytics] ✓ Added class day: ${dateStr}`);
            } else {
              console.log(`[Analytics] ✗ Skipped non-class day: ${dateStr}`);
            }
          } catch (error) {
            console.error(`[Analytics] Error checking class day for ${dateStr}:`, error);
            // If we can't determine, default to including it to be safe
            dailyMap.set(dateStr, { present: 0, late: 0, absent: 0, excused: 0, total: 0 });
            console.log(`[Analytics] ⚠ Added uncertain day: ${dateStr}`);
          }
        }

        console.log(`[Analytics] Initialized ${dailyMap.size} valid class days:`, Array.from(dailyMap.keys()));

        // Process attendance records with detailed logging
        let processedRecords = 0;
        let skippedRecords = 0;
        let absenceCount = 0;
        
        attendanceData?.forEach(record => {
          const dateStats = dailyMap.get(record.date);
          if (!dateStats) {
            console.log(`[Analytics] Skipping record for non-class day: ${record.date} (status: ${record.status})`);
            skippedRecords++;
            return;
          }
          
          dateStats.total++;
          processedRecords++;
          
          // Process status with detailed logging for absences
          switch (record.status) {
            case 'present':
              dateStats.present++;
              totalPresent++;
              break;
            case 'late':
              dateStats.late++;
              totalLate++;
              break;
            case 'excused':
              dateStats.excused++;
              totalExcused++;
              break;
            case 'absent':
              // Check if it should be excused based on excuse_reason
              if (record.excuse_reason && record.excuse_reason.trim()) {
                dateStats.excused++;
                totalExcused++;
                console.log(`[Analytics] Converting absent to excused for ${record.date} due to reason: ${record.excuse_reason}`);
              } else {
                dateStats.absent++;
                totalAbsent++;
                absenceCount++;
                console.log(`[Analytics] ⚠ ABSENCE recorded for ${record.date} (student: ${record.student_id})`);
              }
              break;
            case 'pending':
            default:
              dateStats.absent++;
              totalAbsent++;
              absenceCount++;
              console.log(`[Analytics] ⚠ ABSENCE (pending/other) recorded for ${record.date} (student: ${record.student_id}, status: ${record.status})`);
              break;
          }
        });

        console.log(`[Analytics] Processing summary:`);
        console.log(`  - Processed records: ${processedRecords}`);
        console.log(`  - Skipped records: ${skippedRecords}`);
        console.log(`  - Total absences found: ${absenceCount}`);
        console.log(`  - Final totals - Present: ${totalPresent}, Late: ${totalLate}, Absent: ${totalAbsent}, Excused: ${totalExcused}`);

        // Convert to array format for charts
        const daily = Array.from(dailyMap.entries())
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => a.date.localeCompare(b.date));

        // Log days with absences for verification
        const daysWithAbsences = daily.filter(day => day.absent > 0);
        console.log(`[Analytics] Days with absences in final data (${daysWithAbsences.length} days):`, 
          daysWithAbsences.map(d => ({ 
            date: d.date, 
            absent: d.absent, 
            total: d.total,
            percentage: d.total > 0 ? Math.round((d.absent / d.total) * 100) : 0
          }))
        );

        const analytics: AttendanceAnalytics = {
          daily,
          summary: {
            totalPresent,
            totalLate,
            totalAbsent,
            totalExcused,
            totalRecords: totalPresent + totalLate + totalAbsent + totalExcused
          }
        };

        console.log(`[Analytics] Final analytics summary:`, analytics.summary);
        setData(analytics);
        
      } catch (err) {
        console.error('[Analytics] Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        toast.error(`Failed to load analytics: ${errorMessage}`);
      } finally {
        setIsLoading(false);
        requestInProgress.current = false;
      }
    };

    // Small delay to prevent rapid consecutive calls and ensure state is properly reset
    const timeoutId = setTimeout(fetchAnalytics, 150);
    
    return () => {
      clearTimeout(timeoutId);
      // Don't reset requestInProgress here as it might interfere with ongoing requests
    };
  }, [builderIds, days, dateRange.start, dateRange.end]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      requestInProgress.current = false;
    };
  }, []);

  return { data, isLoading, error };
};
