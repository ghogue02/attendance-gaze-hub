
import { Camera, UserCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface AttendanceSectionProps {
  passiveMode: boolean;
  setPassiveMode: (value: boolean) => void;
  startAttendance: () => void;
}

export const AttendanceSection = ({ 
  passiveMode, 
  setPassiveMode, 
  startAttendance 
}: AttendanceSectionProps) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between glass-card p-4">
        <div className="flex items-center">
          <span className="mr-2">Passive Mode</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">New</span>
        </div>
        <Switch 
          checked={passiveMode} 
          onCheckedChange={setPassiveMode} 
        />
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        {passiveMode 
          ? "Passive mode is active. Camera will automatically start scanning for faces." 
          : "Enable passive mode for automatic face recognition"}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Button
          onClick={startAttendance}
          className="flex-1 flex items-center justify-center gap-2"
          disabled={passiveMode}
        >
          <Camera size={20} />
          {passiveMode ? "Camera Already Active" : "Start Face Recognition"}
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
  );
};
