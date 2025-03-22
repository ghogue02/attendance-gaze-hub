
import { RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/button';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  cameraError: string | null;
  processing: boolean;
  startCamera: () => void;
  statusMessage: string | null;
}

export const CameraView = ({
  videoRef,
  canvasRef,
  isCapturing,
  cameraError,
  processing,
  startCamera,
  statusMessage
}: CameraViewProps) => {
  return (
    <div className="relative rounded-xl overflow-hidden aspect-video">
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
              onClick={startCamera}
              className="flex items-center gap-2 text-sm mx-auto"
            >
              <RefreshCw size={16} />
              Retry
            </Button>
          </div>
        </div>
      )}
      
      <AnimatePresence>
        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <svg className="animate-spin h-10 w-10 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-white">{statusMessage || 'Processing image...'}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
