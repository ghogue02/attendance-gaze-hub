
import { useState, useRef, useEffect } from 'react';
import { Camera, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Builder } from '@/components/BuilderCard';
import { registerFace, checkFaceRegistrationStatus } from '@/utils/faceRecognition';
import { toast } from 'sonner';
import { useCamera } from '@/hooks/use-camera';
import { CameraView } from './CameraView';

interface SimpleFaceCaptureProps {
  builder: Builder;
  onRegistrationComplete: (success: boolean) => void;
  isUpdateMode?: boolean;
}

export const SimpleFaceCapture = ({ 
  builder, 
  onRegistrationComplete,
  isUpdateMode = false
}: SimpleFaceCaptureProps) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>("Camera initializing...");
  const [registrationProgress, setRegistrationProgress] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    },
    onCameraStart: () => {
      console.log('Camera started in SimpleFaceCapture');
      setStatusMessage("Camera ready. Center your face in the frame.");
      loadRegistrationStatus();
    },
    onCameraStop: () => {
      setStatusMessage(null);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    }
  });
  
  const loadRegistrationStatus = async () => {
    try {
      const status = await checkFaceRegistrationStatus(builder.id);
      setRegistrationProgress(status.count / 5 * 100);
    } catch (error) {
      console.error('Error loading registration status:', error);
    }
  };

  const handleCaptureAndRegister = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }
    
    setProcessing(true);
    setError(null);
    setStatusMessage("Processing your image...");
    
    try {
      // Capture the image data
      const imageData = captureImageData();
      
      if (!imageData) {
        setError('Failed to capture image');
        toast.error('Failed to capture image');
        setProcessing(false);
        setStatusMessage("Failed to capture image. Please try again.");
        return;
      }
      
      // Call the registerFace function
      const result = await registerFace(builder.id, imageData);
      
      if (result && result.success) {
        toast.success('Face registered successfully!');
        setStatusMessage("Registration successful!");
        setRegistrationProgress(100);
        onRegistrationComplete(true);
      } else {
        const errorMessage = result && typeof result === 'object' && 'message' in result 
          ? result.message 
          : 'Registration failed';
        setError(errorMessage);
        toast.error(errorMessage);
        setStatusMessage("Registration failed. Please try again.");
        onRegistrationComplete(false);
      }
    } catch (error) {
      console.error('Error in face capture:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during registration';
      setError(errorMessage);
      toast.error('An error occurred during registration');
      setStatusMessage("An error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // If camera isn't working, retry after a delay
  useEffect(() => {
    if (cameraError) {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        console.log("Retrying camera initialization...");
        startCamera();
      }, 3000);
    }
    
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [cameraError, startCamera]);

  return (
    <div className="space-y-4">
      <CameraView 
        videoRef={videoRef}
        canvasRef={canvasRef}
        isCapturing={isCapturing}
        cameraError={cameraError}
        processing={processing}
        startCamera={startCamera}
        statusMessage={statusMessage}
      />
      
      {error && (
        <div className="p-3 bg-destructive/10 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {registrationProgress > 0 && registrationProgress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full" 
            style={{ width: `${registrationProgress}%` }}
          ></div>
        </div>
      )}
      
      <div className="flex flex-col space-y-4">
        <p className="text-center text-muted-foreground">
          Look directly at the camera for best results. Make sure your face is well-lit and centered in the frame.
        </p>
        
        <Button
          size="lg"
          disabled={!isCapturing || processing}
          onClick={handleCaptureAndRegister}
          className="mx-auto"
        >
          {processing ? (
            <span>Processing...</span>
          ) : (
            <span className="flex items-center gap-2">
              {isUpdateMode ? 'Update Face Registration' : 'Register Face'} <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};
