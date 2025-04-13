
import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface CameraDisplayProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  cameraError: string;
  onRestartCamera: () => void;
  processingStatus?: string | null;
}

const CameraDisplay = ({
  videoRef,
  canvasRef,
  isCapturing,
  cameraError,
  onRestartCamera,
  processingStatus = null
}: CameraDisplayProps) => {
  return (
    <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
      {/* Video element with error handling */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        onError={(e) => {
          console.error('Video element error:', e);
        }}
      />
      
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Camera border when active */}
      {isCapturing && !cameraError && (
        <div className="absolute inset-0 border-2 border-primary pointer-events-none animate-pulse opacity-50" />
      )}
      
      {/* Status message when processing */}
      {processingStatus && !cameraError && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {processingStatus}
          </div>
        </div>
      )}
      
      {/* Error display with retry button */}
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center">
          <div>
            <p className="mb-3">{cameraError}</p>
            <Button
              onClick={onRestartCamera}
              className="flex items-center gap-2 text-sm mx-auto"
              variant="secondary"
            >
              <RefreshCw size={16} />
              Retry Camera
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraDisplay;
