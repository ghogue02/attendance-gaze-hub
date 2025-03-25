
import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ProcessingOverlay from './ProcessingOverlay';

interface CameraViewportProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  cameraError: string;
  processing: boolean;
  statusMessage: string | null;
  onRetry: () => void;
}

const CameraViewport = ({
  videoRef,
  canvasRef,
  isCapturing,
  cameraError,
  processing,
  statusMessage,
  onRetry
}: CameraViewportProps) => {
  return (
    <div className="relative rounded-lg overflow-hidden aspect-video bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {isCapturing && !cameraError && (
        <div className="absolute inset-0 border-2 border-primary pointer-events-none animate-pulse opacity-50" />
      )}
      
      {statusMessage && !cameraError && !processing && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {statusMessage}
          </div>
        </div>
      )}
      
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center">
          <div>
            <p className="mb-3">{cameraError}</p>
            <Button
              onClick={onRetry}
              className="flex items-center gap-2 text-sm mx-auto"
            >
              <RefreshCw size={16} />
              Retry
            </Button>
          </div>
        </div>
      )}
      
      <ProcessingOverlay show={processing} message={statusMessage} />
    </div>
  );
};

export default CameraViewport;
