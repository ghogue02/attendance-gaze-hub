
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
  passiveInterval = 1000 // Default to 1-second interval for better responsiveness
}: AttendanceCameraProps) => {
  const [processingImage, setProcessingImage] = useState(false);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const passiveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognizedBuildersRef = useRef<Set<string>>(new Set());
  const [scanCount, setScanCount] = useState(0);
  const consecutiveFailsRef = useRef(0);
  const initialDelayCompleteRef = useRef(false);
  
  // More aggressive scanning for passive mode - try every 700ms
  const effectivePassiveInterval = passive ? (passiveInterval < 700 ? passiveInterval : 700) : passiveInterval;

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
    videoConstraints: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
      // Request higher frame rate for better face detection
      frameRate: { ideal: 30 }
    },
    onCameraStart: () => {
      // Clear session storage camera start time to reset detection behavior
      window.sessionStorage.removeItem('cameraStartTime');
      
      setStatusMessage("Camera initializing, please wait...");
      recognizedBuildersRef.current.clear();
      setScanCount(0);
      consecutiveFailsRef.current = 0;
      initialDelayCompleteRef.current = false;
      
      // Add a shorter initial delay before starting passive detection
      // but still enough to let camera properly initialize
      if (passive) {
        setTimeout(() => {
          initialDelayCompleteRef.current = true;
          setStatusMessage("Camera ready - scanning for faces...");
          // Start passive scanning after initialization delay
          captureImagePassive();
        }, 1000);
      } else {
        // In active mode, ready immediately
        setStatusMessage("Camera active, position your face in the frame");
      }
    },
    onCameraStop: () => {
      setStatusMessage(null);
      if (passiveTimeoutRef.current) {
        clearTimeout(passiveTimeoutRef.current);
      }
    }
  });

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (passiveTimeoutRef.current) {
        clearTimeout(passiveTimeoutRef.current);
      }
    };
  }, []);

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
        recognizedBuildersRef.current.add(builder.id);
        setLastDetectionTime(Date.now());
        consecutiveFailsRef.current = 0;
      },
      onError: (message) => {
        toast.error(message);
        setStatusMessage("No match found. Try again.");
        
        // Reset processing state in active mode
        setTimeout(() => {
          setProcessingImage(false);
          setStatusMessage("Ready to try again");
        }, 1500);
      },
      onComplete: () => {
        setProcessingImage(false);
      }
    });
  };
  
  const captureImagePassive = () => {
    if (!isCapturing || !initialDelayCompleteRef.current) return;
    
    // Only check for processingImage if we've been processing for more than 3 seconds
    // This prevents the system from getting stuck if a process hangs
    const isHung = processingImage && (Date.now() - lastDetectionTime > 3000);
    
    if (processingImage && !isHung) {
      // Still processing previous image, try again later
      passiveTimeoutRef.current = setTimeout(() => {
        captureImagePassive();
      }, 500); // Try again sooner
      return;
    }
    
    // If we were hung, log it and continue
    if (isHung) {
      console.warn("Processing took too long, continuing with next scan");
      setProcessingImage(false);
    }
    
    setScanCount(prev => prev + 1);
    setProcessingImage(true);
    setLastDetectionTime(Date.now());
    
    const imageData = captureImageData();
    if (!imageData) {
      setProcessingImage(false);
      
      // Set up next passive scan
      passiveTimeoutRef.current = setTimeout(() => {
        captureImagePassive();
      }, effectivePassiveInterval);
      
      return;
    }
    
    console.log(`Passive scan #${scanCount + 1} - processing image`);
    
    processRecognition(imageData, {
      isPassive: true,
      onSuccess: (builder) => {
        // Only notify if this is a new recognition
        if (!recognizedBuildersRef.current.has(builder.id)) {
          onBuilderDetected?.(builder);
          toast.success(`Attendance recorded: ${builder.name}`);
          recognizedBuildersRef.current.add(builder.id);
          
          // Update status with count of recognized builders
          setStatusMessage(`Recognized ${recognizedBuildersRef.current.size} ${
            recognizedBuildersRef.current.size === 1 ? 'builder' : 'builders'
          } (Scan #${scanCount})`);
        } else {
          console.log(`Builder ${builder.name} already recognized recently`);
        }
        setLastDetectionTime(Date.now());
        consecutiveFailsRef.current = 0;
      },
      onError: (message) => {
        // Only count consecutive failures for "No face detected"
        if (message === 'No face detected in frame') {
          consecutiveFailsRef.current++;
          
          if (consecutiveFailsRef.current > 5) {
            // After several consecutive failures, update the status message
            setStatusMessage(`Waiting for builders... (Scan #${scanCount})`);
          } else {
            setStatusMessage(`Scanning for builders... (Scan #${scanCount})`);
          }
        } else if (message !== 'Recently recognized') {
          // For other messages, reset consecutive fails counter
          consecutiveFailsRef.current = 0;
          setStatusMessage(`Scanning for builders... (Scan #${scanCount}): ${message}`);
        }
      },
      onComplete: () => {
        setProcessingImage(false);
        
        // Set up next passive scan - use a shorter interval for more aggressive scanning
        passiveTimeoutRef.current = setTimeout(() => {
          captureImagePassive();
        }, effectivePassiveInterval);
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
        recognizedCount={recognizedBuildersRef.current.size}
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
