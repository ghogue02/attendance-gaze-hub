
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Builder } from '../BuilderCard';
import { registerFaceImage, updateBuilderAvatar } from '@/utils/faceRecognition';
import { CameraView } from './CameraView';
import { RegistrationProgress } from './RegistrationProgress';
import { CaptureControls } from './CaptureControls';
import { useCamera } from '@/hooks/use-camera';
import { detectFaces } from '@/utils/faceRecognition/recognitionUtils';
import { RegistrationCaptureProps } from './types';

export const RegistrationCapture = ({ 
  builder, 
  onRegistrationUpdate
}: RegistrationCaptureProps) => {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>("Initializing camera...");
  const [autoCapture, setAutoCapture] = useState(true);
  const autoCaptureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessingTimeRef = useRef<number>(0);
  const consecutiveFailsRef = useRef(0);
  
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
      setStatusMessage("Camera active. Auto-capturing when face detected...");
      if (autoCapture) {
        startAutoCapture();
      }
    }
  });

  useEffect(() => {
    return () => {
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
      }
    };
  }, []);

  const startAutoCapture = () => {
    if (!isCapturing || processing) return;
    
    // Don't run if we're already processing for more than 3 seconds (hung state)
    const isHung = processing && (Date.now() - lastProcessingTimeRef.current > 3000);
    if (processing && !isHung) {
      autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 500);
      return;
    }
    
    if (isHung) {
      console.warn("Processing took too long, continuing with next scan");
      setProcessing(false);
    }
    
    checkForFace();
  };

  const checkForFace = async () => {
    if (!isCapturing || !videoRef.current) {
      autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 500);
      return;
    }
    
    try {
      const imageData = captureImageData();
      if (!imageData) {
        setStatusMessage("Failed to capture image. Retrying...");
        autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 500);
        return;
      }
      
      // Only check for face, don't register yet
      setStatusMessage(`Checking for face for angle ${currentAngle + 1}...`);
      const result = await detectFaces(imageData, true);
      
      if (result.success && result.hasFaces) {
        setStatusMessage(`Face detected! Capturing angle ${currentAngle + 1}...`);
        consecutiveFailsRef.current = 0;
        captureImage(imageData);
      } else {
        consecutiveFailsRef.current++;
        if (consecutiveFailsRef.current > 3) {
          setStatusMessage(`No face detected. Position your face for angle ${currentAngle + 1}.`);
        } else {
          setStatusMessage(`Looking for face for angle ${currentAngle + 1}...`);
        }
        autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 500);
      }
    } catch (error) {
      console.error("Error in face detection:", error);
      setStatusMessage("Error detecting face. Retrying...");
      autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 1000);
    }
  };

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
      const result = await registerFaceImage(builder.id, imageData, currentAngle);
      console.log("Registration result:", result);
      
      if (result.success) {
        toast.success(result.message);
        setStatusMessage(`Angle ${currentAngle + 1} registered successfully!`);
        
        const newCapturedImages = [...capturedImages];
        newCapturedImages[currentAngle] = imageData;
        setCapturedImages(newCapturedImages);
        
        if (currentAngle === 0) {
          console.log("Updating builder avatar with angle 0 image");
          await updateBuilderAvatar(builder.id, imageData);
          toast.success("Profile image updated!");
        }
        
        // Only set registrationComplete to true when all angles are completed and we're not in update mode
        if (result.completed && !isUpdateMode) {
          console.log("Registration complete!");
          onRegistrationUpdate(true, 100, currentAngle);
        } else if (result.imageCount) {
          // In update mode, continue with the next angle
          let nextAngle = currentAngle;
          if (result.nextAngleIndex !== undefined) {
            nextAngle = result.nextAngleIndex;
            setCurrentAngle(nextAngle);
          } else {
            nextAngle = (currentAngle + 1) % 5;
            setCurrentAngle(nextAngle);
          }
          
          const newProgress = (result.imageCount / 5) * 100;
          setProgress(newProgress);
          onRegistrationUpdate(false, newProgress, nextAngle);
          
          // If all angles are completed in update mode, only mark as complete after the last angle
          if (result.completed && isUpdateMode && result.nextAngleIndex === 0) {
            console.log("Update complete!");
            onRegistrationUpdate(true, 100, nextAngle);
          } else {
            setStatusMessage(`Ready for angle ${nextAngle + 1}. Position your face...`);
            // Continue auto capture for the next angle
            if (autoCapture) {
              autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 1000);
            }
          }
        }
      } else {
        toast.error(result.message);
        setStatusMessage(`Error: ${result.message}`);
        
        if (autoCapture) {
          autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 1000);
        }
      }
    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('An unexpected error occurred');
      setStatusMessage('Registration error. Please try again.');
      
      if (autoCapture) {
        autoCaptureTimeoutRef.current = setTimeout(startAutoCapture, 1000);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleAutoCapture = () => {
    const newAutoCapture = !autoCapture;
    setAutoCapture(newAutoCapture);
    if (newAutoCapture) {
      startAutoCapture();
    } else if (autoCaptureTimeoutRef.current) {
      clearTimeout(autoCaptureTimeoutRef.current);
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
