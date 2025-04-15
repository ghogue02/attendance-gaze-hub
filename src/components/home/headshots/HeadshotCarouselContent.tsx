
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from '@/components/ui/carousel';
import { HeadshotData } from '@/utils/headshots/headshotCache';

interface HeadshotCarouselContentProps {
  headshots: HeadshotData[];
}

const HeadshotCarouselContent = ({ headshots }: HeadshotCarouselContentProps) => {
  return (
    <div className="glass-card p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-center">Builder Spotlights</h2>
      <Carousel 
        className="w-full"
        opts={{ 
          loop: true,
          dragFree: true
        }}
        autoplay={true}
        autoplayInterval={5000}
      >
        <CarouselContent>
          {headshots.map((headshot, index) => (
            <CarouselItem key={index} className="flex flex-col items-center basis-full md:basis-1/2 lg:basis-1/3">
              <div className="relative w-40 h-40 mx-auto mb-4">
                <Avatar className="w-40 h-40 border-2 border-primary/10">
                  <AvatarImage 
                    src={headshot.base64Data || headshot.url} 
                    alt={headshot.name}
                    className="object-cover" 
                    onError={(e) => {
                      console.error(`Error loading image for ${headshot.name}`);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <AvatarFallback className="text-4xl bg-primary/10">
                    {headshot.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h3 className="text-center font-medium text-lg">{headshot.name}</h3>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious className="absolute -left-4 top-1/2" />
          <CarouselNext className="absolute -right-4 top-1/2" />
        </div>
      </Carousel>
      <p className="text-center text-xs text-muted-foreground mt-4">
        {headshots.length} builder{headshots.length !== 1 ? 's' : ''} featured
      </p>
    </div>
  );
};

export default HeadshotCarouselContent;
