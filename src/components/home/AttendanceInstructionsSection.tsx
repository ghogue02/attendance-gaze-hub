
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface AttendanceInstructionsSectionProps {
  passiveMode: boolean;
  setPassiveMode: (value: boolean) => void;
  setIsCameraActive: () => void;
}

export const AttendanceInstructionsSection = ({
  passiveMode,
  setPassiveMode,
  setIsCameraActive
}: AttendanceInstructionsSectionProps) => {
  return (
    <div className="flex flex-col space-y-6 items-center md:items-start">
      <h2 className="text-xl font-semibold">Attendance Recognition</h2>
      <p className="text-muted-foreground text-center md:text-left">
        {passiveMode
          ? "Passive mode is active. Just look at the camera to be recognized."
          : "Position your face clearly in the frame and click the capture button."}
      </p>
      
      <div className="flex items-center space-x-4">
        <Switch 
          checked={passiveMode} 
          onCheckedChange={setPassiveMode} 
          id="passive-mode"
        />
        <label htmlFor="passive-mode" className="text-sm">
          Passive Mode {passiveMode ? "Enabled" : "Disabled"}
        </label>
      </div>
      
      <Button 
        onClick={setIsCameraActive}
        variant="secondary"
        className="py-3 flex items-center justify-center gap-2"
      >
        {passiveMode ? "Disable Passive Mode" : "Cancel"}
      </Button>
    </div>
  );
};
