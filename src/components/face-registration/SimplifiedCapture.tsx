
import { useState, useRef, useEffect } from 'react';
import { Camera, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Builder } from '@/components/BuilderCard';
import { registerFace } from '@/utils/faceRecognition';
import { testRegistrationFlow } from '@/utils/faceRecognition/facenetIntegration';
import { toast } from 'sonner';
import { useCamera } from '@/hooks/use-camera';

interface SimplifiedCaptureProps {
  builder: Builder;
  onRegistrationComplete: (success: boolean) => void;
}

export const SimplifiedCapture = ({ builder, onRegistrationComplete }: SimplifiedCaptureProps) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  
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
      console.log('Camera started, pre-loading face models...');
      try {
        // Preload face models while camera is warming up
        const { initModels } = await import('@/utils/faceRecognition/browser-facenet');
        await initModels();
      } catch (e) {
        console.warn('Error preloading face models:', e);
      }
    }
  });

  const handleCaptureAndRegister = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      // Capture the image data
      const imageData = captureImageData();
      
      if (!imageData) {
        setError('Failed to capture image');
        toast.error('Failed to capture image');
        setProcessing(false);
        return;
      }
      
      console.log('Using FaceNet registration method');
      
      // In debug mode, run the test registration flow
      if (debugMode) {
        const testResult = await testRegistrationFlow(builder.id, imageData);
        if (testResult) {
          toast.success('Test registration successful!');
          onRegistrationComplete(true);
        } else {
          setError('Test registration failed - see console for details');
          toast.error('Test registration failed');
        }
        setProcessing(false);
        return;
      }
      
      // Normal registration
      const result = await registerFace(builder.id, imageData);
      
      if (result.success) {
        toast.success('Face registered successfully!');
        onRegistrationComplete(true);
      } else {
        const errorMessage = result && typeof result === 'object' && 'message' in result 
          ? result.message 
          : 'Registration failed';
        setError(errorMessage);
        toast.error(errorMessage);
        onRegistrationComplete(false);
      }
    } catch (error) {
      console.error('Error in face capture:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during registration';
      setError(errorMessage);
      toast.error('An error occurred during registration');
      setProcessing(false);
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
      
      {error && (
        <div className="p-3 bg-destructive/10 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="flex flex-col space-y-2">
        <p className="text-center text-muted-foreground">
          Look directly at the camera for best results. Make sure your face is well-lit and centered in the frame.
        </p>
        
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDebugMode(!debugMode)}
          >
            {debugMode ? 'Normal Mode' : 'Debug Mode'}
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
                {debugMode ? 'Run Test Registration' : 'Register Face'} <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
