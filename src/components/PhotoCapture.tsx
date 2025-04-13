
import { useState, useRef } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { Builder } from './builder/types';
import { Button } from './ui/button';
import { useCamera } from '@/hooks/camera';
import { updateBuilderAvatar } from '@/utils/faceRecognition/registration/updateAvatar';
// Import markAttendance directly from attendance utils
import { markAttendance } from '@/utils/attendance';
import { toast } from 'sonner';
import { compressImage } from '@/hooks/camera/captureImage';

interface PhotoCaptureProps {
  builder: Builder;
  onSuccess: (updatedBuilder: Builder) => void;
}

export const PhotoCapture = ({ builder, onSuccess }: PhotoCaptureProps) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const {
    videoRef,
    isCapturing,
    cameraError,
    startCamera,
    stopCamera,
    captureImageData
  } = useCamera({
    isCameraActive: true,
    canvasRef,
    videoConstraints: {
      facingMode: 'user',
      width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 720, max: 1080 }
    }
  });

  const handleCapture = async () => {
    if (!isCapturing || processing) return;
    
    setProcessing(true);
    setError(null);
    
    const toastId = toast.loading('Capturing photo...');
    
    try {
      // Capture image data
      const imageData = captureImageData();
      
      if (!imageData) {
        throw new Error('Failed to capture image');
      }
      
      // Log the image size
      console.log(`Captured image size: ${Math.round(imageData.length / 1024)}KB`);
      
      // Always compress image to ensure it's not too large
      toast.loading('Processing image...', { id: toastId });
      const processedImage = await compressImage(imageData, 800);
      console.log(`Processed image size: ${Math.round(processedImage.length / 1024)}KB`);
      
      // Update the builder's avatar with processed image
      toast.loading('Updating profile...', { id: toastId });
      console.log(`Updating profile for builder ID: ${builder.id}`);
      const success = await updateBuilderAvatar(builder.id, processedImage);
      
      if (!success) {
        throw new Error('Failed to update profile image');
      }
      
      // Mark attendance
      toast.loading('Recording attendance...', { id: toastId });
      const attendanceResult = await markAttendance(builder.id, 'present');
      
      if (!attendanceResult) {
        console.warn('Failed to mark attendance, but profile was updated');
      }
      
      // Create updated builder object
      const updatedBuilder: Builder = {
        ...builder,
        status: 'present',
        timeRecorded: new Date().toLocaleTimeString([], {
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true
        }),
        image: processedImage
      };
      
      toast.success('Photo captured and attendance recorded!', { id: toastId });
      onSuccess(updatedBuilder);
    } catch (error) {
      console.error('Error capturing photo:', error);
      setError(error instanceof Error ? error.message : 'Failed to capture photo');
      toast.error('Failed to capture photo', { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryCamera = () => {
    setError(null);
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        <canvas ref={canvasRef} className="hidden" />
        
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center">
            <div>
              <p className="mb-3">{cameraError}</p>
              <Button
                onClick={handleRetryCamera}
                className="flex items-center gap-2 text-sm mx-auto"
              >
                <RefreshCw size={16} />
                Retry
              </Button>
            </div>
          </div>
        )}
        
        {processing && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-white">Processing...</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-destructive/10 p-3 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}
      
      <Button
        onClick={handleCapture}
        disabled={!isCapturing || processing}
        className="w-full py-6 flex items-center justify-center gap-2"
      >
        <Camera className="h-5 w-5" />
        {processing ? 'Processing...' : 'Take Photo'}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        Position yourself in the center of the frame and click the button to take a photo
      </p>
    </div>
  );
};
