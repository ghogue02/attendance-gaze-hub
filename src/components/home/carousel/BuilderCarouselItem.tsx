
import { Builder } from '@/components/builder/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CarouselItem } from '@/components/ui/carousel';
import { useBuilderAttendance } from '@/hooks/useBuilderAttendance';
import AttendanceBadge from '@/components/builder/AttendanceBadge';
import { useState } from 'react';

interface BuilderCarouselItemProps {
  builder: Builder;
}

export const BuilderCarouselItem = ({ builder }: BuilderCarouselItemProps) => {
  // Add a state to track if this component is "open" - for carousel items we can set it always true
  // since they're always visible
  const [isVisible] = useState(true);
  
  // Fix: Add the second parameter (isOpen) to the hook call
  const { attendanceRate } = useBuilderAttendance(builder.id, isVisible);

  return (
    <CarouselItem key={builder.id} className="pl-6 basis-1/6 md:basis-1/6 lg:basis-1/6">
      <div className="flex flex-col items-center p-2">
        <div className="relative">
          <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-green-400">
            {builder.image ? (
              <AvatarImage src={builder.image} alt={builder.name} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {builder.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            )}
          </Avatar>
          <AttendanceBadge attendanceRate={attendanceRate} />
        </div>
        <p className="text-xs md:text-sm mt-2 text-center font-medium max-w-28 truncate">{builder.name}</p>
      </div>
    </CarouselItem>
  );
};

export default BuilderCarouselItem;
