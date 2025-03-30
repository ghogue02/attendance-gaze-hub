
import { useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentDateString } from '@/utils/date/dateUtils';

export const usePresentBuilders = (initialBuilders: Builder[]) => {
  const [presentBuilders, setPresentBuilders] = useState<Builder[]>(
    initialBuilders.filter(builder => builder.status === 'present')
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPresentBuilders = async () => {
      setIsLoading(true);
      const today = getCurrentDateString();
      console.log(`Fetching present builders for date: ${today}`);
      
      try {
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
        
        console.log(`Found ${attendanceData.length} attendance records for present builders`);
        
        if (attendanceData.length === 0) {
          setPresentBuilders([]);
          setIsLoading(false);
          return;
        }
        
        const studentIds = attendanceData.map(record => record.student_id);
        
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, first_name, last_name, student_id, image_url')
          .in('id', studentIds);
          
        if (studentsError) {
          console.error('Error fetching student details:', studentsError);
          setIsLoading(false);
          return;
        }
        
        console.log(`Retrieved ${studentsData.length} student records for present builders`);
        
        const builders: Builder[] = studentsData.map(student => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          builderId: student.student_id || '',
          status: 'present',
          timeRecorded: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}),
          image: student.image_url
        }));
        
        setPresentBuilders(builders);
      } catch (error) {
        console.error('Unexpected error fetching present builders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPresentBuilders();
    
    // Set up real-time updates
    const today = getCurrentDateString();
    const channel = supabase
      .channel('present-builders-carousel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance', filter: `date=eq.${today}` },
        () => {
          console.log('Attendance change detected, refreshing present builders');
          fetchPresentBuilders();
        }
      )
      .subscribe();
      
    console.log('Subscribed to attendance changes for present builders carousel');
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    console.log(`Carousel initialized with ${presentBuilders.length} present builders out of ${initialBuilders.length} total`);
    console.log(`Today's date: ${getCurrentDateString()}`);
  }, [presentBuilders.length, initialBuilders.length]);

  return { presentBuilders, isLoading };
};

export default usePresentBuilders;
