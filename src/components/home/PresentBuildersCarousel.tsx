import { useEffect, useState, useRef } from 'react';
import { Builder } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { motion } from 'framer-motion';
import { getCurrentDateString } from '@/utils/date/dateUtils';

interface PresentBuildersCarouselProps {
  initialBuilders: Builder[];
}

const PresentBuildersCarousel = ({ initialBuilders }: PresentBuildersCarouselProps) => {
  const [presentBuilders, setPresentBuilders] = useState<Builder[]>(
    initialBuilders.filter(builder => builder.status === 'present')
  );
  const [api, setApi] = useState<CarouselApi>();
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    console.log(`Carousel initialized with ${presentBuilders.length} present builders out of ${initialBuilders.length} total`);
    console.log(`Today's date: ${getCurrentDateString()}`);
  }, [presentBuilders.length, initialBuilders.length]);

  useEffect(() => {
    if (!api || presentBuilders.length <= 4) return;
    
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
    }
    
    autoScrollTimerRef.current = setInterval(() => {
      if (presentBuilders.length > 4) {
        const nextIndex = (currentIndex + 1) % presentBuilders.length;
        setCurrentIndex(nextIndex);
        api.scrollTo(nextIndex);
      }
    }, 2500);
    
    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [api, presentBuilders.length, currentIndex]);
  
  useEffect(() => {
    if (!api) return;
    
    const onScroll = () => {
      const index = api.selectedScrollSnap();
      setCurrentIndex(index);
    };
    
    api.on("select", onScroll);
    
    return () => {
      api.off("select", onScroll);
    };
  }, [api]);
  
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
  
  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8 pb-8 w-full"
      >
        <div className="glass-card p-4 rounded-lg">
          <h2 className="text-center text-xl font-semibold mb-4">Present Today</h2>
          <div className="flex justify-center py-6">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  if (presentBuilders.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8 pb-8 w-full"
      >
        <div className="glass-card p-4 rounded-lg">
          <h2 className="text-center text-xl font-semibold mb-4">Present Today</h2>
          <p className="text-center text-muted-foreground">No builders are present yet</p>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 pb-12 w-full"
    >
      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-center text-xl font-semibold mb-6">Present Today ({presentBuilders.length})</h2>
        <Carousel 
          setApi={setApi}
          opts={{
            align: 'start',
            loop: true,
            dragFree: true,
            containScroll: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-6">
            {presentBuilders.map((builder) => (
              <CarouselItem key={builder.id} className="pl-6 basis-1/4 md:basis-1/4 lg:basis-1/4">
                <div className="flex flex-col items-center p-3">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-green-400">
                    {builder.image ? (
                      <AvatarImage src={builder.image} alt={builder.name} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {builder.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <p className="text-sm mt-3 text-center font-medium max-w-32 truncate">{builder.name}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </motion.div>
  );
};

export default PresentBuildersCarousel;
