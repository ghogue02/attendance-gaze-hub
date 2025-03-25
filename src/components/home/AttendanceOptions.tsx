
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface AttendanceOptionsProps {
  startAttendance: () => void;
}

const AttendanceOptions = ({ 
  startAttendance 
}: AttendanceOptionsProps) => {
  return (
    <div className="glass-card p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={startAttendance}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Camera size={20} />
          Take Attendance Photo
        </Button>
      </div>
    </div>
  );
};

export default AttendanceOptions;
