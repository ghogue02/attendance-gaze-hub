
import { Camera } from 'lucide-react';
import { Button } from '../ui/button';
import { AutoCaptureToggle } from './AutoCaptureToggle';
import { CaptureControlsProps } from './types';

export const CaptureControls = ({ 
  autoCapture,
  onToggleAutoCapture,
  onManualCapture,
  isCapturing,
  processing,
  currentAngle
}: CaptureControlsProps) => {
  return (
    <div className="flex flex-col space-y-4 mt-auto">
      <AutoCaptureToggle 
        isActive={autoCapture} 
        onToggle={onToggleAutoCapture}
      />
      
      <Button
        onClick={onManualCapture}
        disabled={!isCapturing || processing}
        className="flex items-center gap-2"
      >
        <Camera size={18} />
        {autoCapture ? "Manual Capture" : "Capture Angle"} {currentAngle + 1}
      </Button>
    </div>
  );
};
