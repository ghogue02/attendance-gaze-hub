
import { Camera, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Builder } from '@/components/BuilderCard';

interface AttendanceSectionProps {
  isCameraActive: boolean;
  detectedBuilder: Builder | null;
  startAttendance: () => void;
  reset: () => void;
}

export const AttendanceSection = ({ 
  isCameraActive,
  detectedBuilder,
  startAttendance,
  reset
}: AttendanceSectionProps) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="glass-card p-6">
        {detectedBuilder ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-md">
              Builder detected: {detectedBuilder.name}
            </div>
            
            <Button
              onClick={reset}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              Start New Session
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <p className="text-muted-foreground text-sm">
              {isCameraActive 
                ? "Camera is active. Position yourself in the frame..."
                : "Take a picture to check in for attendance"}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Link to="/register">
                  <UserCircle2 size={20} />
                  Register
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
