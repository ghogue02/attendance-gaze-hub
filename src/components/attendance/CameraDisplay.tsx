
import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface CameraDisplayProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  cameraError: string;
  onRestartCamera: () => void;
}

const CameraDisplay = ({
  videoRef,
  canvasRef,
  isCapturing,
  cameraError,
  onRestartCamera
}: CameraDisplayProps) => {
  return (
    <div className="relative rounded-lg overflow-hidden aspect-video bg-black shadow-md">
      {/* Video element for camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Highlight border when camera is active */}
      {isCapturing && !cameraError && (
        <div className="absolute inset-0 border-2 border-primary pointer-events-none" />
      )}
      
      {/* Camera status message */}
      {isCapturing && !cameraError && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            Camera ready
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
          <p className="mb-4">Camera error: {cameraError}</p>
          <Button
            onClick={onRestartCamera}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Restart Camera
          </Button>
        </div>
      )}
    </div>
  );
};

export default CameraDisplay;
