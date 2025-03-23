
import { useState, useRef, useEffect } from 'react';
import { Camera, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Builder } from '@/components/BuilderCard';
import { registerFaceWithFacenet, checkFaceRegistrationStatus } from '@/utils/faceRecognition';
import { toast } from 'sonner';
import { useCamera } from '@/hooks/camera';
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
  const [cameraReady, setCameraReady] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cameraAttemptsRef = useRef(0);
  
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
      setCameraReady(true);
      loadRegistrationStatus();
    },
    onCameraStop: () => {
      setStatusMessage(null);
      setCameraReady(false);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    }
  });
  
  // Add auto-retry for camera initialization
  useEffect(() => {
    // Try to start the camera when component mounts
    if (!isCapturing && cameraAttemptsRef.current < 3) {
      const delay = cameraAttemptsRef.current * 500; // Increasing delay for retries
      console.log(`Attempting to start camera (attempt ${cameraAttemptsRef.current + 1})`);
      
      setTimeout(() => {
        cameraAttemptsRef.current += 1;
        startCamera();
      }, delay);
    }
    
    return () => {
      // Clean up on unmount
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      stopCamera();
    };
  }, []);
  
  const loadRegistrationStatus = async () => {
    try {
      const status = await checkFaceRegistrationStatus(builder.id);
      console.log("Registration status loaded:", status);
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
    
    if (!cameraReady) {
      toast.error('Please wait for camera to initialize fully');
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
      
      console.log("Image captured successfully, dimensions:", 
        videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
      
      // Call the registerFace function with the update mode flag - FIX: Pass only two arguments
      console.log("Registering face with update mode:", isUpdateMode);
      const result = await registerFaceWithFacenet(builder.id, imageData);
      
      if (result) {
        toast.success('Face registered successfully!');
        setStatusMessage("Registration successful!");
        setRegistrationProgress(100);
        
        // Force refresh by calling loadRegistrationStatus
        await loadRegistrationStatus();
        
        // Short delay before calling complete
        setTimeout(() => {
          onRegistrationComplete(true);
        }, 1000);
      } else {
        setError('Registration failed');
        toast.error('Registration failed');
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

  const handleRestartCamera = () => {
    setStatusMessage("Restarting camera...");
    setError(null);
    stopCamera();
    
    // Reset the camera attempts counter for a fresh start
    cameraAttemptsRef.current = 0;
    
    setTimeout(() => {
      startCamera();
    }, 1000);
  };

  // If camera isn't working, retry after a delay
  useEffect(() => {
    if (cameraError) {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      setCameraReady(false);
      setStatusMessage(`Camera error: ${cameraError}`);
      
      retryTimeoutRef.current = setTimeout(() => {
        console.log("Retrying camera initialization...");
        handleRestartCamera();
      }, 3000);
    }
    
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [cameraError]);

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
        
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestartCamera}
            disabled={processing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart Camera
          </Button>
          
          <Button
            size="lg"
            disabled={!isCapturing || processing || !cameraReady}
            onClick={handleCaptureAndRegister}
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
    </div>
  );
};
