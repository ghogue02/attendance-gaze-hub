
import React from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraControlsProps {
  passive: boolean;
  isCapturing: boolean;
  processingImage: boolean;
  onCaptureClick: () => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  passive,
  isCapturing,
  processingImage,
  onCaptureClick
}) => {
  if (passive) {
    return (
      <div className="mt-2 text-center text-sm text-muted-foreground">
        <p>Passive recognition active. Just look at the camera.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex justify-center">
      <Button
        onClick={onCaptureClick}
        disabled={!isCapturing || processingImage}
        className={`flex items-center gap-2 ${
          (!isCapturing || processingImage) && 'opacity-50 cursor-not-allowed'
        }`}
      >
        <Camera size={18} />
        <span>Capture Attendance</span>
      </Button>
    </div>
  );
};

export default CameraControls;
