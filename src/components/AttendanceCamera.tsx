
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Builder } from './BuilderCard';
import { useCamera } from '@/hooks/use-camera';
import { processRecognition } from '@/utils/faceRecognition/recognitionService';
import { processSimplifiedRecognition } from '@/utils/faceRecognition/simplifiedRecognitionService';
import CameraView from './attendance/CameraView';
import CameraControls from './attendance/CameraControls';

interface AttendanceCameraProps {
  onBuilderDetected?: (builder: Builder) => void;
  isCameraActive?: boolean;
  passive?: boolean;
  passiveInterval?: number;
  debugMode?: boolean;
  useSimplifiedRecognition?: boolean;
}

const AttendanceCamera = ({ 
  onBuilderDetected, 
  isCameraActive = false,
  passive = false,
  passiveInterval = 1000,
  debugMode = false,
  useSimplifiedRecognition = true
}: AttendanceCameraProps) => {
  const [processingImage, setProcessingImage] = useState(false);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const passiveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognizedBuildersRef = useRef<Set<string>>(new Set());
  const [scanCount, setScanCount] = useState(0);
  const consecutiveFailsRef = useRef(0);
  const initialDelayCompleteRef = useRef(false);
  const [initializingModels, setInitializingModels] = useState(false);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const effectivePassiveInterval = passive ? (passiveInterval < 700 ? passiveInterval : 700) : passiveInterval;

  const { 
    videoRef, 
    canvasRef, 
    isCapturing, 
    cameraError, 
    startCamera, 
    stopCamera, 
    captureImageData,
    checkCameraHealth
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
      
      preloadRecognitionModels();
      
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
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    }
  });
  
  // Regular health checks
  useEffect(() => {
    if (isCameraActive && isCapturing) {
      // Set up health check interval
      healthCheckIntervalRef.current = setInterval(() => {
        const isHealthy = checkCameraHealth();
        if (!isHealthy) {
          console.warn('Camera health check failed, will auto-restart');
          setStatusMessage("Camera reconnecting...");
        } else {
          console.log('Camera health check passed');
        }
      }, 3000);
    }
    
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [isCameraActive, isCapturing, checkCameraHealth]);
  
  const preloadRecognitionModels = async () => {
    try {
      setInitializingModels(true);
      
      if (!useSimplifiedRecognition) {
        // Only load facenet models if we're using the complex recognition
        const { initModels } = await import('@/utils/faceRecognition/browser-facenet');
        const success = await initModels();
        
        if (success) {
          console.log('Face recognition models loaded successfully');
        } else {
          console.warn('Failed to load face recognition models');
          toast.error('Face recognition initialization failed');
        }
      } else {
        console.log('Using simplified recognition - no models to load');
      }
    } catch (error) {
      console.error('Error preloading models:', error);
    } finally {
      setInitializingModels(false);
    }
  };

  useEffect(() => {
    return () => {
      if (passiveTimeoutRef.current) {
        clearTimeout(passiveTimeoutRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, []);

  const captureImage = () => {
    if (!isCapturing) {
      toast.error("Camera is not active. Try restarting the camera.");
      return;
    }
    
    if (initializingModels) {
      toast.error("Face recognition models are still loading, please wait");
      return;
    }
    
    setProcessingImage(true);
    setStatusMessage("Processing your image...");
    
    const imageData = captureImageData();
    if (!imageData) {
      setProcessingImage(false);
      toast.error("Failed to capture image. Please check that your camera is working properly.");
      return;
    }
    
    if (debugMode) {
      console.log("Capturing image in active mode");
    }
    
    // Choose which recognition method to use
    if (useSimplifiedRecognition) {
      // Use simplified recognition for better reliability
      processSimplifiedRecognition(imageData, {
        isPassive: false,
        debugMode: debugMode,
        timeout: 15000,
        onSuccess: (builder) => {
          onBuilderDetected?.(builder);
          toast.success(`Builder successfully recognized: ${builder.name}`);
          recognizedBuildersRef.current.add(builder.id);
          setLastDetectionTime(Date.now());
          consecutiveFailsRef.current = 0;
        },
        onError: (message) => {
          if (message === 'No face detected in frame') {
            toast.error("No face detected. Please center your face in the frame and ensure good lighting.");
          } else {
            toast.error(message);
          }
          
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
    } else {
      // Use the standard recognition
      processRecognition(imageData, {
        isPassive: false,
        debugMode: debugMode,
        timeout: 15000,
        onSuccess: (builder) => {
          onBuilderDetected?.(builder);
          toast.success(`Builder successfully recognized: ${builder.name}`);
          recognizedBuildersRef.current.add(builder.id);
          setLastDetectionTime(Date.now());
          consecutiveFailsRef.current = 0;
        },
        onError: (message) => {
          if (message === 'No face detected in frame') {
            toast.error("No face detected. Please center your face in the frame and ensure good lighting.");
          } else {
            toast.error(message);
          }
          
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
    }
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
    
    // Choose which recognition method to use
    if (useSimplifiedRecognition) {
      // Use simplified recognition for better reliability
      processSimplifiedRecognition(imageData, {
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
    } else {
      // Use the standard recognition
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
    }
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
