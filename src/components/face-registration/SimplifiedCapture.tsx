
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Builder } from '@/components/BuilderCard';
import { useCamera } from '@/hooks/use-camera';
import { registerFaceWithoutDetection } from '@/utils/faceRecognition/fallbackRecognition';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw } from 'lucide-react';

interface SimplifiedCaptureProps {
  builder: Builder;
  onRegistrationComplete: (success: boolean) => void;
}

export const SimplifiedCapture = ({
  builder,
  onRegistrationComplete
}: SimplifiedCaptureProps) => {
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>("Position yourself in the frame and click Capture");
  
  const {
    videoRef,
    canvasRef,
    isCapturing,
    cameraError,
    startCamera,
    captureImageData
  } = useCamera({
    isCameraActive: true,
    videoConstraints: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  });

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not initialized properly');
      return;
    }
    
    setProcessing(true);
    setStatusMessage('Processing image...');
    
    const imageData = captureImageData();
    
    if (!imageData) {
      toast.error('Failed to capture image');
      setProcessing(false);
      setStatusMessage('Failed to capture image. Try again.');
      return;
    }
    
    try {
      const result = await registerFaceWithoutDetection(builder.id, imageData);
      
      if (result.success) {
        toast.success(result.message || 'Face registered successfully');
        setStatusMessage('Face registered successfully!');
        onRegistrationComplete(true);
      } else {
        toast.error(result.message || 'Registration failed');
        setStatusMessage(`Error: ${result.message || 'Registration failed'}. Please try again.`);
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('An unexpected error occurred');
      setStatusMessage('Registration error. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden aspect-video shadow-glass border border-white/10 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        <canvas ref={canvasRef} className="hidden" />
        
        {statusMessage && !cameraError && !processing && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium">
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
                variant="secondary"
              >
                <RefreshCw size={16} />
                Retry Camera
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
            <p className="text-white">{statusMessage || 'Processing image...'}</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-center">
        <Button 
          onClick={captureImage} 
          disabled={processing || !isCapturing}
          className="flex items-center gap-2"
        >
          <Camera size={16} />
          {processing ? 'Processing...' : 'Capture Image'}
        </Button>
      </div>
      
      <div className="text-sm text-muted-foreground text-center max-w-md mx-auto">
        <p>Make sure your face is clearly visible in the frame before capturing.</p>
        <p className="mt-2">This simplified registration process doesn't verify face detection but will work for attendance.</p>
      </div>
    </div>
  );
};
