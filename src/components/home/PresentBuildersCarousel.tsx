
import { Builder } from '@/components/builder/types';
import CarouselLoading from './carousel/CarouselLoading';
import CarouselEmpty from './carousel/CarouselEmpty';
import BuilderCarouselContent from './carousel/BuilderCarouselContent';
import usePresentBuilders from './carousel/usePresentBuilders';

interface PresentBuildersCarouselProps {
  initialBuilders: Builder[];
}

const PresentBuildersCarousel = ({ initialBuilders }: PresentBuildersCarouselProps) => {
  const { presentBuilders, isLoading } = usePresentBuilders(initialBuilders);
  
  if (isLoading) {
    return <CarouselLoading />;
  }
  
  if (presentBuilders.length === 0) {
    return <CarouselEmpty />;
  }
  
  return <BuilderCarouselContent builders={presentBuilders} />;
};

export default PresentBuildersCarousel;
