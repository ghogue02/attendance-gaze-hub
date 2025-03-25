
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttendanceErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const AttendanceErrorDisplay = ({ 
  message, 
  onRetry, 
  showRetry = true 
}: AttendanceErrorDisplayProps) => {
  return (
    <div className="p-3 bg-destructive/10 rounded-lg">
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-destructive">Profile Image Error</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      
      {showRetry && onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2"
          onClick={onRetry}
        >
          <RefreshCw className="h-3 w-3 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default AttendanceErrorDisplay;
