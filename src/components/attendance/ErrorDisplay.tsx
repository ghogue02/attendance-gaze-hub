
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  if (!error) return null;
  
  return (
    <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-start gap-2">
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    </div>
  );
};

export default ErrorDisplay;
