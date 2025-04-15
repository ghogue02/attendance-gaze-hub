
import { AlertCircle } from 'lucide-react';

interface HeadshotErrorStateProps {
  error: string | null;
}

const HeadshotErrorState = ({ error }: HeadshotErrorStateProps) => {
  return (
    <div className="glass-card p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-center">Builder Spotlights</h2>
      <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-muted-foreground mb-2">{error || 'No headshots available'}</p>
        <p className="text-xs text-muted-foreground/80">
          Check Supabase storage bucket "headshots" for image files
        </p>
      </div>
    </div>
  );
};

export default HeadshotErrorState;
