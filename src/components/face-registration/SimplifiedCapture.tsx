
import { useState, useRef } from 'react';
import { Camera, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Builder } from '@/components/BuilderCard';
import { registerFaceWithoutDetection } from '@/utils/faceRecognition';
import { toast } from 'sonner';
import { useCamera } from '@/hooks/use-camera';

interface SimplifiedCaptureProps {
  builder: Builder;
  onRegistrationComplete: (success: boolean) => void;
}

export const SimplifiedCapture = ({ builder, onRegistrationComplete }: SimplifiedCaptureProps) => {
  const [processing, setProcessing] = useState(false);
  
  const {
    videoRef,
    canvasRef,
    isCapturing,
    cameraError,
    startCamera,
    stopCamera,
    captureImageData
  } = useCamera({
    isCameraActive: true,
    videoConstraints: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  });

  const handleCaptureAndRegister = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }
    
    setProcessing(true);
    try {
      // Capture the image data
      const imageData = captureImageData();
      
      if (!imageData) {
        toast.error('Failed to capture image');
        setProcessing(false);
        return;
      }
      
      // Register the face using the simplified approach
      const result = await registerFaceWithoutDetection(builder.id, imageData);
      
      if (result.success) {
        toast.success('Face registered successfully!');
        onRegistrationComplete(true);
      } else {
        // Fixed: Check if result is an object with a message property
        const errorMessage = result && typeof result === 'object' && 'message' in result 
          ? result.message 
          : 'Registration failed';
        toast.error(errorMessage);
        onRegistrationComplete(false);
      }
    } catch (error) {
      console.error('Error in simplified capture:', error);
      toast.error('An error occurred during registration');
      onRegistrationComplete(false);
    } finally {
      setProcessing(false);
    }
  };

  if (cameraError) {
    return (
      <div className="text-center p-6 bg-destructive/10 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Camera Error</h3>
        <p className="text-muted-foreground mb-4">
          {cameraError}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {!isCapturing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Button 
              size="lg" 
              onClick={startCamera}
              className="flex items-center gap-2"
            >
              <Camera className="h-5 w-5" />
              Start Camera
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-2">
        <p className="text-center text-muted-foreground">
          This is a simplified registration process. Just look at the camera and click the button below.
        </p>
        
        <Button
          className="w-full"
          size="lg"
          disabled={!isCapturing || processing}
          onClick={handleCaptureAndRegister}
        >
          {processing ? (
            <span>Processing...</span>
          ) : (
            <span className="flex items-center gap-2">
              Register Face <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};
