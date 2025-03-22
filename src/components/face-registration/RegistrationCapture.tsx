
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { registerFaceImage, updateBuilderAvatar } from '@/utils/faceRecognition';
import { CameraView } from './CameraView';
import { RegistrationProgress } from './RegistrationProgress';
import { CaptureControls } from './CaptureControls';
import { useCamera } from '@/hooks/use-camera';
import { detectFaces } from '@/utils/faceRecognition/recognitionUtils';
import { RegistrationCaptureProps } from './types';

export const RegistrationCapture = ({ 
  builder, 
  onRegistrationUpdate,
  isUpdateMode = false
}: RegistrationCaptureProps) => {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateMode, setUpdateMode] = useState(isUpdateMode);
  const [statusMessage, setStatusMessage] = useState<string | null>("Initializing camera...");
  const [autoCapture, setAutoCapture] = useState(true);

  const autoCaptureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessingTimeRef = useRef<number>(0);
  const consecutiveFailsRef = useRef(0);
  const lastCaptureAttemptRef = useRef<number>(0);
  const faceDetectionSuccessRef = useRef(false);
  
  useEffect(() => {
    setUpdateMode(isUpdateMode);
  }, [isUpdateMode]);
  
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
    },
    onCameraStart: () => {
      setStatusMessage("Camera active. " + (autoCapture ? "Auto-capturing when face detected..." : "Click 'Capture' when ready."));
      if (autoCapture) {
        startAutoCapture();
      }
    }
  });

  // Cleanup function for timeout
  useEffect(() => {
    return () => {
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
      }
    };
  }, []);

  // Handle auto-capture toggle
  useEffect(() => {
    if (autoCapture && isCapturing && !processing) {
      startAutoCapture();
    } else if (!autoCapture && autoCaptureTimeoutRef.current) {
      clearTimeout(autoCaptureTimeoutRef.current);
    }
  }, [autoCapture, isCapturing, processing]);

  // Auto-capture logic
  const startAutoCapture = () => {
    if (!isCapturing || processing) return;
    
    // Check if processing is hung
    const isHung = processing && (Date.now() - lastProcessingTimeRef.current > 3000);
    if (processing && !isHung) {
      autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 500);
      return;
    }
    
    if (isHung) {
      console.log("Processing took too long, continuing with next scan");
      setProcessing(false);
    }
    
    // Rate limit capture attempts
    const now = Date.now();
    const timeSinceLastCapture = now - lastCaptureAttemptRef.current;
    if (timeSinceLastCapture < 2000) {
      autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 2000 - timeSinceLastCapture + 100);
      return;
    }
    
    checkForFace();
  };

  // Check for face in camera frame
  const checkForFace = async () => {
    if (!isCapturing || !videoRef.current) {
      autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 500);
      return;
    }
    
    lastCaptureAttemptRef.current = Date.now();
    
    try {
      const imageData = captureImageData();
      if (!imageData) {
        setStatusMessage("Failed to capture image. Retrying...");
        autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 1000);
        return;
      }
      
      setStatusMessage(`Checking for face for angle ${currentAngle + 1}...`);
      console.log("Checking for face in current frame...");
      
      // For a smoother experience with failing Vision API, be more lenient
      // and try to proceed with capture more quickly
      const failureThreshold = updateMode ? 3 : 4;
      
      if (consecutiveFailsRef.current >= failureThreshold) {
        console.log(`Many detection attempts (${consecutiveFailsRef.current}), proceeding with capture`);
        setStatusMessage(`Capturing angle ${currentAngle + 1}...`);
        captureImage(imageData);
        return;
      }
      
      const result = await detectFaces(imageData, true, consecutiveFailsRef.current);
      console.log("Face detection result:", result);
      
      if (result.success && result.hasFaces) {
        setStatusMessage(`Face detected! Capturing angle ${currentAngle + 1}...`);
        console.log("Face detected, proceeding with capture");
        consecutiveFailsRef.current = 0;
        faceDetectionSuccessRef.current = true;
        captureImage(imageData);
      } else {
        consecutiveFailsRef.current++;
        console.log(`No face detected (attempt ${consecutiveFailsRef.current})`);
        
        if (consecutiveFailsRef.current >= 3) {
          // After a few failed attempts, just capture anyway
          console.log("Multiple detection failures - proceeding with capture anyway");
          setStatusMessage(`Capturing angle ${currentAngle + 1}...`);
          captureImage(imageData);
          return;
        }
        
        setStatusMessage(`Looking for face for angle ${currentAngle + 1}...`);
        const delay = Math.min(800 + (consecutiveFailsRef.current * 100), 1500);
        autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, delay);
      }
    } catch (error) {
      console.error("Error in face detection:", error);
      setStatusMessage("Error detecting face. Proceeding with capture...");
      
      consecutiveFailsRef.current++;
      
      // After a couple errors, just try to capture anyway
      if (consecutiveFailsRef.current >= 2) {
        console.log("Multiple errors in face detection - trying to capture anyway");
        const imageData = captureImageData();
        if (imageData) {
          setStatusMessage(`Proceeding with capture for angle ${currentAngle + 1}...`);
          captureImage(imageData);
          return;
        }
      }
      
      const delay = Math.min(1000 + (consecutiveFailsRef.current * 200), 2000);
      autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, delay);
    }
  };

  // Capture and register image
  const captureImage = async (imageData?: string) => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not initialized properly');
      return;
    }
    
    setProcessing(true);
    lastProcessingTimeRef.current = Date.now();
    setStatusMessage('Processing image...');
    
    if (!imageData) {
      imageData = captureImageData();
    }
    
    if (!imageData) {
      toast.error('Failed to capture image');
      setProcessing(false);
      setStatusMessage('Failed to capture image. Try again.');
      if (autoCapture) {
        autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 1000);
      }
      return;
    }
    
    console.log(`Capturing image for angle ${currentAngle}`);
    
    try {
      const result = await registerFaceImage(builder.id, imageData, currentAngle, updateMode);
      console.log("Registration result:", result);
      
      if (result.success) {
        toast.success(result.message);
        setStatusMessage(`Angle ${currentAngle + 1} registered successfully!`);
        
        // Store captured image
        const newCapturedImages = [...capturedImages];
        newCapturedImages[currentAngle] = imageData;
        setCapturedImages(newCapturedImages);
        
        if (result.completed) {
          console.log("Registration complete!");
          onRegistrationUpdate(true, 100, currentAngle);
        } else if (result.nextAngleIndex !== undefined) {
          // Move to next angle
          const nextAngle = result.nextAngleIndex;
          setCurrentAngle(nextAngle);
          
          // Update progress
          const newProgress = Math.min(((result.imageCount || 0) / 5) * 100, 80);
          setProgress(newProgress);
          onRegistrationUpdate(false, newProgress, nextAngle);
          
          setStatusMessage(`Ready for angle ${nextAngle + 1}. Position your face...`);
          consecutiveFailsRef.current = 0;
          faceDetectionSuccessRef.current = false;
          
          // Slight delay before next auto-capture
          if (autoCapture) {
            autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 1200);
          }
        }
      } else {
        toast.error(result.message || 'Registration failed');
        setStatusMessage(`Error: ${result.message || 'Registration failed'}. Try again.`);
        
        if (autoCapture) {
          autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 1500);
        }
      }
    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('An unexpected error occurred');
      setStatusMessage('Registration error. Please try again.');
      
      if (autoCapture) {
        autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 1500);
      }
    } finally {
      setProcessing(false);
    }
  };

  // Toggle auto-capture mode
  const handleToggleAutoCapture = () => {
    const newAutoCapture = !autoCapture;
    setAutoCapture(newAutoCapture);
    
    if (newAutoCapture && isCapturing && !processing) {
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
      }
      setStatusMessage(newAutoCapture ? "Auto-capture enabled. Looking for face..." : "Auto-capture disabled. Click 'Capture' when ready.");
      startAutoCapture();
    } else if (autoCaptureTimeoutRef.current) {
      clearTimeout(autoCaptureTimeoutRef.current);
      setStatusMessage("Auto-capture disabled. Click 'Capture' when ready.");
    }
  };

  const angleInstructions = [
    "Look directly at the camera",
    "Turn your head slightly to the left",
    "Turn your head slightly to the right",
    "Tilt your head slightly up",
    "Tilt your head slightly down",
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <CameraView
        videoRef={videoRef}
        canvasRef={canvasRef}
        isCapturing={isCapturing}
        cameraError={cameraError}
        processing={processing}
        startCamera={startCamera}
        statusMessage={statusMessage}
      />
      
      <div className="flex flex-col">
        <RegistrationProgress
          progress={progress}
          currentAngle={currentAngle}
          capturedImages={capturedImages}
          angleInstructions={angleInstructions}
        />
        
        <CaptureControls
          autoCapture={autoCapture}
          onToggleAutoCapture={handleToggleAutoCapture}
          onManualCapture={() => captureImage()}
          isCapturing={isCapturing}
          processing={processing}
          currentAngle={currentAngle}
        />
      </div>
    </div>
  );
};
