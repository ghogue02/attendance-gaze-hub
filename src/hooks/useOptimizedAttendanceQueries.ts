import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus, AttendanceRecord } from '@/components/builder/types';
import { toast } from 'sonner';
import { isClassDay } from '@/utils/attendance/isClassDay';

export interface AttendanceQueryResult {
  records: AttendanceRecord[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * A hook for optimized attendance data fetching
 * Uses batch fetching and caching to reduce database load
 */
export const useOptimizedAttendanceQueries = () => {
  // Cache storage with TTL management
  const cacheRef = useRef<{
    [key: string]: {
      data: any;
      timestamp: number;
      ttl: number;
    }
  }>({});
  
  // Cache duration - 5 minutes
  const DEFAULT_CACHE_TTL = 5 * 60 * 1000;
  
  /**
   * Get data from cache if available and not expired
   */
  const getFromCache = useCallback((key: string) => {
    const cached = cacheRef.current[key];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`[useOptimizedAttendanceQueries] Cache hit for ${key}`);
      return cached.data;
    }
    return null;
  }, []);
  
  /**
   * Store data in cache with specified TTL
   */
  const storeInCache = useCallback((key: string, data: any, ttl = DEFAULT_CACHE_TTL) => {
    cacheRef.current[key] = {
      data,
      timestamp: Date.now(),
      ttl
    };
  }, []);
  
  /**
   * Fetch builders with attendance status for a specific date in a single optimized query
   */
  const fetchBuildersForDate = useCallback(async (dateString: string): Promise<Builder[]> => {
    const cacheKey = `builders_${dateString}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
    
    console.log(`[useOptimizedAttendanceQueries] Fetching all builders with attendance for ${dateString}`);
    
    try {
      // Fetch all students in a single query
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_id, image_url, notes')
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });
      
      if (studentsError) {
        throw new Error(`Failed to fetch students: ${studentsError.message}`);
      }
      
      // Get all attendance records for this date in a single query
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status, time_recorded, excuse_reason, notes')
        .eq('date', dateString);
        
      if (attendanceError) {
        throw new Error(`Failed to fetch attendance: ${attendanceError.message}`);
      }
      
      // Map attendance to students efficiently
      const attendanceMap = new Map();
      attendanceRecords?.forEach(record => {
        if (record.student_id) {
          attendanceMap.set(record.student_id, record);
        }
      });
      
      // Helper function to validate status
      const validateStatus = (status: string | null): BuilderStatus => {
        if (!status) return 'pending';
        if (['present', 'absent', 'excused', 'pending', 'late'].includes(status)) {
          return status as BuilderStatus;
        }
        return 'pending';
      };
      
      // Merge data in memory rather than with multiple DB queries
      const builders: Builder[] = students.map(student => {
        const attendance = attendanceMap.get(student.id);
        
        let status: BuilderStatus = 'pending';
        
        if (attendance) {
          if (attendance.status === 'present') status = 'present';
          else if (attendance.status === 'late') status = 'late';
          else if (attendance.status === 'excused') status = 'excused';
          else if (attendance.status === 'absent') {
            status = attendance.excuse_reason ? 'excused' : 'absent';
          }
          // else status remains 'pending'
        }
           
        return {
          id: student.id,
          name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
          builderId: student.student_id || 'N/A',
          status,
          timeRecorded: attendance?.time_recorded ? 
            new Date(attendance.time_recorded).toLocaleTimeString([], {
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: true
            }) : undefined,
          image: student.image_url,
          excuseReason: attendance?.excuse_reason,
          notes: attendance?.notes || student.notes
        };
      });
      
      // Store in cache
      storeInCache(cacheKey, builders);
      
      return builders;
    } catch (error) {
      console.error('[useOptimizedAttendanceQueries] Error:', error);
      toast.error('Failed to load builder data');
      return [];
    }
  }, [getFromCache, storeInCache]);
  
  /**
   * Fetch attendance history for a specific builder with batch loading
   */
  const fetchAttendanceHistory = useCallback(async (builderId: string): Promise<AttendanceRecord[]> => {
    const cacheKey = `history_${builderId}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
    
    console.log(`[useOptimizedAttendanceQueries] Fetching attendance history for builder ${builderId}`);
    
    try {
      const ATTENDANCE_START_DATE = '2025-03-01';
      
      const { data, error } = await supabase
        .from('attendance')
        .select('id, date, status, time_recorded, notes, excuse_reason')
        .eq('student_id', builderId)
        .gte('date', ATTENDANCE_START_DATE)
        .order('date', { ascending: false });
        
      if (error) {
        throw new Error(`Failed to fetch attendance history: ${error.message}`);
      }
      
      // Filter for valid class days
      const validAttendanceData = data.filter(record => isClassDay(record.date));
      console.log(`[useOptimizedAttendanceQueries] Filtered ${data.length} records to ${validAttendanceData.length} valid class days`);
      
      // Helper function to validate status as BuilderStatus
      const validateStatus = (status: string | null): BuilderStatus => {
        if (!status) return 'pending';
        if (['present', 'absent', 'excused', 'pending', 'late'].includes(status)) {
          return status as BuilderStatus;
        }
        return 'pending';
      };
      
      const formattedHistory: AttendanceRecord[] = validAttendanceData.map(record => ({
        id: record.id,
        date: record.date,
        status: validateStatus(record.status),
        timeRecorded: record.time_recorded ? 
          new Date(record.time_recorded).toLocaleTimeString() : '',
        notes: record.notes || '',
        excuseReason: record.excuse_reason || ''
      }));
      
      // Store in cache with longer TTL for historical data (10 minutes)
      storeInCache(cacheKey, formattedHistory, 10 * 60 * 1000);
      
      return formattedHistory;
    } catch (error) {
      console.error('[useOptimizedAttendanceQueries] Error:', error);
      toast.error('Failed to load attendance history');
      return [];
    }
  }, [getFromCache, storeInCache]);
  
  /**
   * Force refresh data in cache
   */
  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      delete cacheRef.current[key];
    } else {
      cacheRef.current = {};
    }
  }, []);
  
  return {
    fetchBuildersForDate,
    fetchAttendanceHistory,
    invalidateCache
  };
};
