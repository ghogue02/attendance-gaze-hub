
import { Loader2 } from 'lucide-react';

const LoadingState = () => {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
};

export default LoadingState;
