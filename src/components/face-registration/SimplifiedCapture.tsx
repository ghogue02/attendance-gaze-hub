
import { useState, useRef, useEffect } from 'react';
import { Camera, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Builder } from '@/components/BuilderCard';
import { registerFaceWithFacenet, checkFaceRegistrationStatus } from '@/utils/faceRecognition';
import { toast } from 'sonner';
import { useCamera } from '@/hooks/use-camera';

interface SimplifiedCaptureProps {
  builder: Builder;
  onRegistrationComplete: (success: boolean) => void;
  isUpdateMode?: boolean;
}

export const SimplifiedCapture = ({
  builder,
  onRegistrationComplete,
  isUpdateMode = false
}: SimplifiedCaptureProps) => {
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
    onCameraStart: async () => {
      console.log('Camera started, loading registration status...');
      setStatusMessage("Camera ready. Center your face in the frame.");
      
      try {
        // Preload face models while camera is warming up
        const { initModels } = await import('@/utils/faceRecognition/browser-facenet');
        await initModels();
        
        // Load registration status
        await loadRegistrationStatus();
      } catch (e) {
        console.warn('Error initializing:', e);
      }
    }
  });
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      stopCamera();
    };
  }, [stopCamera]);
  
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
      
      // Register face with update mode flag
      console.log("Registering face with update mode:", isUpdateMode);
      const result = await registerFaceWithFacenet(builder.id, imageData, isUpdateMode);
      
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
    
    setTimeout(() => {
      startCamera();
    }, 1000);
  };
  
  // If camera error occurs, show error UI
  if (cameraError) {
    return (
      <div className="text-center p-6 bg-destructive/10 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Camera Error</h3>
        <p className="text-muted-foreground mb-4">
          {cameraError}
        </p>
        <Button variant="outline" onClick={handleRestartCamera}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Camera
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
        
        {statusMessage && (
          <div className="absolute bottom-0 inset-x-0 p-3 bg-black/70 text-white text-center text-sm">
            {statusMessage}
          </div>
        )}
      </div>
      
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
            disabled={!isCapturing || processing}
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
