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
  debugMode?: boolean;
}

const AttendanceCamera = ({ 
  onBuilderDetected, 
  isCameraActive = false,
  passive = false,
  passiveInterval = 1000,
  debugMode = false
}: AttendanceCameraProps) => {
  const [processingImage, setProcessingImage] = useState(false);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const passiveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognizedBuildersRef = useRef<Set<string>>(new Set());
  const [scanCount, setScanCount] = useState(0);
  const consecutiveFailsRef = useRef(0);
  const initialDelayCompleteRef = useRef(false);
  
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
      frameRate: { ideal: 30 }
    },
    onCameraStart: () => {
      window.sessionStorage.removeItem('cameraStartTime');
      
      setStatusMessage("Camera initializing, please wait...");
      recognizedBuildersRef.current.clear();
      setScanCount(0);
      consecutiveFailsRef.current = 0;
      initialDelayCompleteRef.current = false;
      
      if (passive) {
        setTimeout(() => {
          initialDelayCompleteRef.current = true;
          setStatusMessage("Camera ready - waiting for face recognition...");
          captureImagePassive();
        }, 1000);
      } else {
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
    
    if (debugMode) {
      console.log("Capturing image in active mode");
    }
    
    processRecognition(imageData, {
      isPassive: false,
      debugMode: debugMode,
      onSuccess: (builder) => {
        onBuilderDetected?.(builder);
        toast.success(`Builder successfully recognized: ${builder.name}`);
        recognizedBuildersRef.current.add(builder.id);
        setLastDetectionTime(Date.now());
        consecutiveFailsRef.current = 0;
      },
      onError: (message) => {
        toast.error(message);
        setStatusMessage("No match found. Please try again or register your face first.");
        
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
    
    const isHung = processingImage && (Date.now() - lastDetectionTime > 3000);
    
    if (processingImage && !isHung) {
      passiveTimeoutRef.current = setTimeout(() => {
        captureImagePassive();
      }, 500);
      return;
    }
    
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
      
      passiveTimeoutRef.current = setTimeout(() => {
        captureImagePassive();
      }, effectivePassiveInterval);
      
      return;
    }
    
    if (debugMode) {
      console.log(`Passive scan #${scanCount + 1} - processing image`);
    }
    
    processRecognition(imageData, {
      isPassive: true,
      debugMode: debugMode,
      onSuccess: (builder) => {
        if (!recognizedBuildersRef.current.has(builder.id)) {
          onBuilderDetected?.(builder);
          toast.success(`Attendance recorded: ${builder.name}`);
          recognizedBuildersRef.current.add(builder.id);
          
          setStatusMessage(`Recognized ${recognizedBuildersRef.current.size} ${
            recognizedBuildersRef.current.size === 1 ? 'builder' : 'builders'
          } (Scan #${scanCount})`);
        } else {
          if (debugMode) {
            console.log(`Builder ${builder.name} already recognized recently`);
          }
        }
        setLastDetectionTime(Date.now());
        consecutiveFailsRef.current = 0;
      },
      onError: (message) => {
        if (message === 'No face detected in frame') {
          consecutiveFailsRef.current++;
          
          if (consecutiveFailsRef.current > 5) {
            setStatusMessage(`Waiting for faces... (Scan #${scanCount})`);
          } else {
            setStatusMessage(`Looking for registered faces... (Scan #${scanCount})`);
          }
        } else if (message !== 'Recently recognized') {
          consecutiveFailsRef.current = 0;
          setStatusMessage(`Recognition not successful (Scan #${scanCount}): ${message}`);
        }
        
        if (debugMode && message !== 'Recently recognized') {
          console.log(`Recognition error: ${message} (Scan #${scanCount})`);
        }
      },
      onComplete: () => {
        setProcessingImage(false);
        
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
