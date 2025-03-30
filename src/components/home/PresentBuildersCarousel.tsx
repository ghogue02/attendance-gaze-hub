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

  // Set up auto-scrolling
  useEffect(() => {
    if (!api || presentBuilders.length <= 5) return;
    
    // Clear any existing timer
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
    }
    
    // Set up auto-scroll every 3 seconds
    autoScrollTimerRef.current = setInterval(() => {
      api.scrollNext();
    }, 3000);
    
    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [api, presentBuilders.length]);
  
  // Set up real-time updates for attendance changes
  useEffect(() => {
    // Get current date in YYYY-MM-DD format for filtering attendance records
    const today = getCurrentDateString();
    
    // Set up subscription to attendance changes
    const channel = supabase
      .channel('present-builders-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance', filter: `date=eq.${today}` },
        () => {
          // When attendance changes, update our list of builders
          const updatedBuilders = [...initialBuilders];
          // Re-filter to only show present builders
          setPresentBuilders(updatedBuilders.filter(builder => builder.status === 'present'));
        }
      )
      .subscribe();
      
    console.log('Subscribed to attendance changes for present builders carousel');
    
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialBuilders]);
  
  // If no builders are present, don't render the carousel
  if (presentBuilders.length === 0) {
    return null;
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 pb-8 w-full"
    >
      <div className="glass-card p-4 rounded-lg">
        <h2 className="text-center text-xl font-semibold mb-4">Present Today</h2>
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
          <CarouselContent className="px-2">
            {presentBuilders.map((builder) => (
              <CarouselItem key={builder.id} className="basis-1/4 md:basis-1/5 lg:basis-1/6 min-w-20">
                <div className="flex flex-col items-center p-1">
                  <Avatar className="h-16 w-16 border-2 border-green-400">
                    {builder.image ? (
                      <AvatarImage src={builder.image} alt={builder.name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {builder.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <p className="text-xs mt-2 text-center font-medium truncate max-w-20">{builder.name}</p>
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
