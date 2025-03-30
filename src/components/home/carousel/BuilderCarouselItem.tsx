
import { Builder } from '@/components/builder/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CarouselItem } from '@/components/ui/carousel';

interface BuilderCarouselItemProps {
  builder: Builder;
}

export const BuilderCarouselItem = ({ builder }: BuilderCarouselItemProps) => {
  return (
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
  );
};

export default BuilderCarouselItem;
