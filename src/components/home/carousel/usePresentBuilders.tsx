
import { useState, useEffect, useRef } from 'react';
import { Builder } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentDateString, formatISOTimeToEastern } from '@/utils/date/dateUtils';

// Use a shorter cache TTL to reduce excessive API calls while maintaining reasonable freshness
const CACHE_TTL = 60000 * 2; // 2 minutes

export const usePresentBuilders = (initialBuilders: Builder[]) => {
  const [presentBuilders, setPresentBuilders] = useState<Builder[]>(
    initialBuilders.filter(builder => builder.status === 'present')
  );
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchRef = useRef<number>(Date.now());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  
  // Builder map for efficient updates
  const builderMapRef = useRef<Map<string, Builder>>(new Map(
    initialBuilders
      .filter(builder => builder.status === 'present')
      .map(builder => [builder.id, builder])
  ));

  useEffect(() => {
    isMountedRef.current = true;
    
    const fetchPresentBuilders = async () => {
      // Prevent duplicate requests and respect the cache TTL
      const now = Date.now();
      if (isLoadingRef.current || now - lastFetchRef.current < CACHE_TTL) {
        console.log('Skipping present builders fetch - using cached data or already loading');
        return;
      }
      
      isLoadingRef.current = true;
      setIsLoading(true);
      
      const today = getCurrentDateString();
      console.log(`Fetching present builders for date: ${today}`);
      
      try {
        // Use a more efficient query with fewer columns and simplified structure
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('student_id, time_recorded')
          .eq('date', today)
          .eq('status', 'present')
          .limit(100); // Add reasonable limit
          
        if (attendanceError) {
          console.error('Error fetching attendance data:', attendanceError);
          return;
        }
        
        if (attendanceData.length === 0) {
          if (isMountedRef.current) {
            setPresentBuilders([]);
          }
          return;
        }
        
        // Create a map of student IDs to time_recorded
        const timeRecordedMap = new Map<string, string>();
        attendanceData.forEach(record => {
          if (record.student_id && record.time_recorded) {
            // Format the ISO time to Eastern Time
            const easternTime = formatISOTimeToEastern(record.time_recorded);
            timeRecordedMap.set(record.student_id, easternTime);
          }
        });
        
        // Extract just the IDs for the IN query
        const studentIds = attendanceData.map(record => record.student_id);
        
        // Fetch only needed fields to reduce payload size
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, first_name, last_name, student_id, image_url')
          .in('id', studentIds);
          
        if (studentsError) {
          console.error('Error fetching student details:', studentsError);
          return;
        }
        
        // Create builder objects with only necessary data
        const builders: Builder[] = studentsData.map(student => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          builderId: student.student_id || '',
          status: 'present',
          // Use the Eastern Time from the map or default to current time
          timeRecorded: timeRecordedMap.get(student.id) || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}),
          image: student.image_url
        }));
        
        // Update the builder map
        builderMapRef.current.clear();
        builders.forEach(builder => {
          builderMapRef.current.set(builder.id, builder);
        });
        
        if (isMountedRef.current) {
          setPresentBuilders(builders);
          lastFetchRef.current = now;
        }
        
      } catch (error) {
        console.error('Unexpected error fetching present builders:', error);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
        isLoadingRef.current = false;
      }
    };
    
    // Load initial data
    fetchPresentBuilders();
    
    // Set up real-time subscription with throttling
    const today = getCurrentDateString();
    const channelName = `present-builders-${Math.floor(Math.random() * 10000)}`; // Add randomness to avoid conflicts
    
    try {
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'attendance', 
            filter: `date=eq.${today}` 
          },
          () => {
            // Throttle updates to prevent excessive API calls
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
            }
            
            debounceTimerRef.current = setTimeout(() => {
              const now = Date.now();
              const timeSinceLastFetch = now - lastFetchRef.current;
              
              // Only fetch if sufficient time has passed (15 seconds minimum between refreshes)
              if (timeSinceLastFetch > 15000 && !isLoadingRef.current) {
                console.log('Attendance change detected, refreshing present builders after throttle');
                fetchPresentBuilders();
              }
            }, 2000); // 2 second debounce
          }
        )
        .subscribe();
      
      // Clean up
      return () => {
        isMountedRef.current = false;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        // Properly unsubscribe to avoid memory leaks
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      return () => {
        isMountedRef.current = false;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }
  }, [initialBuilders]);

  return { presentBuilders, isLoading };
};

export default usePresentBuilders;
