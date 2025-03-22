
import { Camera, UserCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
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
        <h2 className="text-xl font-semibold mb-4">Attendance System</h2>
        
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
                ? "Camera is active. Position your face in the frame..."
                : "Start face recognition to check in for attendance"}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={startAttendance}
                className="flex-1 flex items-center justify-center gap-2"
                disabled={isCameraActive}
              >
                <Camera size={20} />
                {isCameraActive ? "Camera Active" : "Start Face Recognition"}
              </Button>
              
              <Button
                asChild
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Link to="/register">
                  <UserCircle2 size={20} />
                  Register Face
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
