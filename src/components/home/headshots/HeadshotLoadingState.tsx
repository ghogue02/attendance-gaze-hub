
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const HeadshotLoadingState = () => {
  return (
    <div className="glass-card p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-center">Builder Spotlights</h2>
      <div className="flex flex-col items-center justify-center space-y-4 p-4">
        <Skeleton className="w-40 h-40 rounded-full" />
        <Skeleton className="w-32 h-8" />
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading headshots...
        </div>
      </div>
    </div>
  );
};

export default HeadshotLoadingState;
