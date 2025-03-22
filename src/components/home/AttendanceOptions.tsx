
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { Camera, UserCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AttendanceOptionsProps {
  passiveMode: boolean;
  setPassiveMode: (value: boolean) => void;
  startAttendance: () => void;
}

const AttendanceOptions = ({ 
  passiveMode, 
  setPassiveMode, 
  startAttendance 
}: AttendanceOptionsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6 flex flex-col space-y-6"
    >
      <h2 className="text-xl font-semibold text-center">Attendance Options</h2>
      
      <div className="flex flex-col space-y-3">
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
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        {passiveMode 
          ? "Passive mode will automatically recognize builders without clicks" 
          : "Enable passive mode for automatic face recognition"}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Button
          onClick={startAttendance}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Camera size={20} />
          Start Face Recognition
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
    </motion.div>
  );
};

export default AttendanceOptions;
