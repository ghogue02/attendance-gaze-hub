
import React from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  cameraError: string;
  processingImage: boolean;
  statusMessage: string | null;
  onRetry: () => void;
  recognizedCount?: number;
}

const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  canvasRef,
  isCapturing,
  cameraError,
  processingImage,
  statusMessage,
  onRetry,
  recognizedCount = 0
}) => {
  return (
    <div className="relative rounded-2xl overflow-hidden aspect-video shadow-glass border border-white/10 bg-black">
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
      
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${isCapturing ? 'bg-green-500' : 'bg-red-500'}`}>
          <div className={`h-3 w-3 rounded-full ${isCapturing ? 'bg-green-500' : 'bg-red-500'} animate-ping opacity-75`} />
        </div>
        
        {recognizedCount > 0 && (
          <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Users size={12} />
            <span>{recognizedCount}</span>
          </div>
        )}
      </div>
      
      {statusMessage && (
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
              variant="secondary"
            >
              <RefreshCw size={16} />
              Retry
            </Button>
          </div>
        </div>
      )}
      
      <AnimatePresence>
        {processingImage && (
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
            <p className="text-white">Analyzing face...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CameraView;
