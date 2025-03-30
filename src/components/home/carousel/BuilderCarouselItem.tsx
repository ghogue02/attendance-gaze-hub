
import { Builder } from '@/components/builder/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CarouselItem } from '@/components/ui/carousel';
import { useBuilderAttendance } from '@/hooks/useBuilderAttendance';
import AttendanceBadge from '@/components/builder/AttendanceBadge';

interface BuilderCarouselItemProps {
  builder: Builder;
}

export const BuilderCarouselItem = ({ builder }: BuilderCarouselItemProps) => {
  // Use the hook to get attendance rate
  const { attendanceRate } = useBuilderAttendance(builder.id);

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
