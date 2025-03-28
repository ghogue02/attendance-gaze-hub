
import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const AttendanceLoadingState = memo(() => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
});

AttendanceLoadingState.displayName = 'AttendanceLoadingState';

export default AttendanceLoadingState;
