
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Builder } from './BuilderCard';
import { useCamera } from '@/hooks/use-camera';
import { processRecognition } from '@/utils/faceRecognition/recognitionService';
import CameraView from './attendance/CameraView';
import CameraControls from './attendance/CameraControls';

interface AttendanceCameraProps {
  onBuilderDetected?: (builder: Builder) => void;
  isCameraActive?: boolean;
  passive?: boolean;
  passiveInterval?: number;
}

const AttendanceCamera = ({ 
  onBuilderDetected, 
  isCameraActive = false,
  passive = false,
  passiveInterval = 5000
}: AttendanceCameraProps) => {
  const [processingImage, setProcessingImage] = useState(false);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const passiveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { 
    videoRef, 
    canvasRef, 
    isCapturing, 
    cameraError, 
    startCamera, 
    stopCamera, 
    captureImageData 
  } = useCamera({
    isCameraActive,
    onCameraStart: () => {
      setStatusMessage(passive ? "Scanning for faces..." : "Camera active, ready to capture");
      
      // Initial passive capture if in passive mode
      if (passive) {
        // Small delay to make sure video is initialized
        setTimeout(() => {
          console.log("Starting initial passive scan");
          captureImagePassive();
        }, 1000);
      }
    },
    onCameraStop: () => {
      setStatusMessage(null);
      if (passiveTimeoutRef.current) {
        clearTimeout(passiveTimeoutRef.current);
      }
    }
  });

  // Set up passive mode interval
  useEffect(() => {
    if (passive && isCapturing && !processingImage) {
      console.log("Setting up passive detection interval");
      passiveTimeoutRef.current = setTimeout(() => {
        captureImagePassive();
      }, passiveInterval);
    }

    return () => {
      if (passiveTimeoutRef.current) {
        clearTimeout(passiveTimeoutRef.current);
      }
    };
  }, [passive, isCapturing, processingImage, lastDetectionTime, passiveInterval]);

  const captureImage = () => {
    if (!isCapturing) return;
    
    setProcessingImage(true);
    setStatusMessage("Processing your image...");
    
    const imageData = captureImageData();
    if (!imageData) {
      setProcessingImage(false);
      toast.error("Failed to capture image");
      return;
    }
    
    processRecognition(imageData, {
      isPassive: false,
      onSuccess: (builder) => {
        onBuilderDetected?.(builder);
        toast.success(`Builder successfully recognized: ${builder.name}`);
        setLastDetectionTime(Date.now());
      },
      onError: (message) => {
        toast.error(message);
        setStatusMessage("No match found. Try again.");
        
        // Reset processing state in active mode
        setTimeout(() => {
          setProcessingImage(false);
          setStatusMessage("Ready to try again");
        }, 2000);
      },
      onComplete: () => {
        setProcessingImage(false);
      }
    });
  };
  
  const captureImagePassive = () => {
    if (!isCapturing || processingImage) return;
    
    console.log("Passive capture triggered");
    
    const imageData = captureImageData();
    if (!imageData) return;
    
    processRecognition(imageData, {
      isPassive: true,
      onSuccess: (builder) => {
        onBuilderDetected?.(builder);
        toast.success(`Attendance recorded: ${builder.name}`);
        setLastDetectionTime(Date.now());
      },
      onComplete: () => {
        // Set up next passive scan
        passiveTimeoutRef.current = setTimeout(() => {
          captureImagePassive();
        }, passiveInterval);
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <CameraView
        videoRef={videoRef}
        canvasRef={canvasRef}
        isCapturing={isCapturing}
        cameraError={cameraError}
        processingImage={processingImage}
        statusMessage={statusMessage}
        onRetry={startCamera}
      />
      
      <CameraControls
        passive={passive}
        isCapturing={isCapturing}
        processingImage={processingImage}
        onCaptureClick={captureImage}
      />
    </div>
  );
};

export default AttendanceCamera;
