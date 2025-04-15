
import { useHeadshots } from '@/hooks/useHeadshots';
import HeadshotLoadingState from '@/components/home/headshots/HeadshotLoadingState';
import HeadshotErrorState from '@/components/home/headshots/HeadshotErrorState';
import HeadshotCarouselContent from '@/components/home/headshots/HeadshotCarouselContent';

const HeadshotsCarousel = () => {
  const { headshots, loading, error } = useHeadshots();
  
  if (loading) {
    return <HeadshotLoadingState />;
  }
  
  if (error || headshots.length === 0) {
    return <HeadshotErrorState error={error} />;
  }
  
  return <HeadshotCarouselContent headshots={headshots} />;
};

export default HeadshotsCarousel;
