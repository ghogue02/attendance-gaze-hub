
import { Builder } from '@/components/builder/types';
import { Carousel, CarouselContent, CarouselApi } from '@/components/ui/carousel';
import { motion } from 'framer-motion';
import BuilderCarouselItem from './BuilderCarouselItem';
import { useEffect, useState } from 'react';

interface BuilderCarouselContentProps {
  builders: Builder[];
  autoScroll?: boolean;
}

export const BuilderCarouselContent = ({ 
  builders, 
  autoScroll = true 
}: BuilderCarouselContentProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Setup auto-scrolling
  useEffect(() => {
    if (!api || builders.length <= 6 || !autoScroll) return;
    
    const autoScrollTimer = setInterval(() => {
      if (builders.length > 6) {
        const nextIndex = (currentIndex + 1) % builders.length;
        setCurrentIndex(nextIndex);
        api.scrollTo(nextIndex);
      }
    }, 2500);
    
    return () => {
      clearInterval(autoScrollTimer);
    };
  }, [api, builders.length, currentIndex, autoScroll]);
  
  // Track scroll changes
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 pb-12 w-full"
    >
      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-center text-xl font-semibold mb-6">Present Today ({builders.length})</h2>
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
            {builders.map((builder) => (
              <BuilderCarouselItem key={builder.id} builder={builder} />
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </motion.div>
  );
};

export default BuilderCarouselContent;
