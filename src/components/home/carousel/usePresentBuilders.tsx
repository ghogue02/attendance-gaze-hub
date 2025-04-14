
import { useState, useEffect, useRef } from 'react';
import { Builder } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentDateString } from '@/utils/date/dateUtils';

// Global debug flag - set to false to reduce console noise
const DEBUG_LOGGING = false;

export const usePresentBuilders = (initialBuilders: Builder[]) => {
  const [presentBuilders, setPresentBuilders] = useState<Builder[]>(
    initialBuilders.filter(builder => builder.status === 'present')
  );
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const cacheTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cache TTL in milliseconds
  const CACHE_TTL = 60000 * 10; // 10 minutes
  
  // Use a builder ID map for efficient updates
  const builderMapRef = useRef<Map<string, Builder>>(new Map());

  useEffect(() => {
    // Initialize builder map with initial builders
    initialBuilders.forEach(builder => {
      if (builder.status === 'present') {
        builderMapRef.current.set(builder.id, builder);
      }
    });
    
    const fetchPresentBuilders = async () => {
      // Skip if we fetched recently
      const now = Date.now();
      if (now - lastFetchRef.current < CACHE_TTL) {
        DEBUG_LOGGING && console.log('Skipping present builders fetch - using cached data');
        return;
      }
      
      setIsLoading(true);
      const today = getCurrentDateString();
      DEBUG_LOGGING && console.log(`Fetching present builders for date: ${today}`);
      
      try {
        // Optimized to fetch both tables in a more efficient way
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('student_id')
          .eq('date', today)
          .eq('status', 'present');
          
        if (attendanceError) {
          console.error('Error fetching attendance data:', attendanceError);
          setIsLoading(false);
          return;
        }
        
        DEBUG_LOGGING && console.log(`Found ${attendanceData.length} attendance records for present builders`);
        
        if (attendanceData.length === 0) {
          setPresentBuilders([]);
          setIsLoading(false);
          return;
        }
        
        const studentIds = attendanceData.map(record => record.student_id);
        
        // Use a batch query instead of individual queries
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, first_name, last_name, student_id, image_url')
          .in('id', studentIds);
          
        if (studentsError) {
          console.error('Error fetching student details:', studentsError);
          setIsLoading(false);
          return;
        }
        
        DEBUG_LOGGING && console.log(`Retrieved ${studentsData.length} student records for present builders`);
        
        const builders: Builder[] = studentsData.map(student => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          builderId: student.student_id || '',
          status: 'present',
          timeRecorded: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}),
          image: student.image_url
        }));
        
        // Update the builder map
        builderMapRef.current.clear();
        builders.forEach(builder => {
          builderMapRef.current.set(builder.id, builder);
        });
        
        setPresentBuilders(builders);
        lastFetchRef.current = now;
        
        // Set a cache timeout to automatically refresh data
        if (cacheTimeoutRef.current) {
          clearTimeout(cacheTimeoutRef.current);
        }
        
        cacheTimeoutRef.current = setTimeout(() => {
          lastFetchRef.current = 0; // Force refresh on next use
        }, CACHE_TTL);
        
      } catch (error) {
        console.error('Unexpected error fetching present builders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPresentBuilders();
    
    // Set up real-time updates with optimized subscription
    const today = getCurrentDateString();
    
    // Create a unique channel name to avoid conflicts
    const channelName = `present-builders-${Date.now()}`;
    
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
            // Use a rate-limited fetch when we get updates
            const now = Date.now();
            const timeSinceLastFetch = now - lastFetchRef.current;
            
            if (timeSinceLastFetch > 5000) { // At minimum 5s between refreshes
              DEBUG_LOGGING && console.log('Attendance change detected, refreshing present builders');
              fetchPresentBuilders();
            } else {
              DEBUG_LOGGING && console.log(`Skipping refresh (last fetch was ${timeSinceLastFetch}ms ago)`);
              // Schedule a fetch for later if we're getting a lot of rapid updates
              if (!cacheTimeoutRef.current) {
                cacheTimeoutRef.current = setTimeout(() => {
                  fetchPresentBuilders();
                }, 5000); // Wait 5s before refreshing if we get a burst of updates
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            DEBUG_LOGGING && console.log('Subscribed to attendance changes for present builders carousel');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Error subscribing to attendance changes:', status);
          }
        });
      
      // Clean up
      return () => {
        // Use try-catch to handle potential channel removal errors
        try {
          supabase.channel(channelName).unsubscribe();
          if (cacheTimeoutRef.current) {
            clearTimeout(cacheTimeoutRef.current);
          }
        } catch (err) {
          console.error('Error cleaning up channel:', err);
        }
      };
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      return () => {
        if (cacheTimeoutRef.current) {
          clearTimeout(cacheTimeoutRef.current);
        }
      };
    }
  }, [initialBuilders]);

  return { presentBuilders, isLoading };
};

export default usePresentBuilders;
