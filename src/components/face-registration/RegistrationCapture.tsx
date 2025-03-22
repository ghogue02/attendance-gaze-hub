
import { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Builder } from '../BuilderCard';
import { registerFaceImage, updateBuilderAvatar } from '@/utils/faceRecognition';
import { Button } from '../ui/button';
import { RegistrationProgress } from './RegistrationProgress';
import { CameraView } from './CameraView';
import { useCamera } from '@/hooks/use-camera';

interface RegistrationCaptureProps {
  builder: Builder;
  onRegistrationUpdate: (completed: boolean, progress: number, currentAngle: number) => void;
}

export const RegistrationCapture = ({ 
  builder, 
  onRegistrationUpdate
}: RegistrationCaptureProps) => {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  
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
    }
  });

  const angleInstructions = [
    "Look directly at the camera",
    "Turn your head slightly to the left",
    "Turn your head slightly to the right",
    "Tilt your head slightly up",
    "Tilt your head slightly down",
  ];

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setProcessing(true);
    const imageData = captureImageData();
    
    if (!imageData) {
      toast.error('Failed to capture image');
      setProcessing(false);
      return;
    }
    
    console.log(`Capturing image for angle ${currentAngle}`);
    
    const result = await registerFaceImage(builder.id, imageData, currentAngle);
    console.log("Registration result:", result);
    
    if (result.success) {
      toast.success(result.message);
      
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
        }
      }
    } else {
      toast.error(result.message);
    }
    
    setProcessing(false);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <CameraView
        videoRef={videoRef}
        canvasRef={canvasRef}
        isCapturing={isCapturing}
        cameraError={cameraError}
        processing={processing}
        startCamera={startCamera}
      />
      
      <div className="flex flex-col">
        <RegistrationProgress
          progress={progress}
          currentAngle={currentAngle}
          capturedImages={capturedImages}
          angleInstructions={angleInstructions}
        />
        
        <Button
          onClick={captureImage}
          disabled={!isCapturing || processing}
          className="flex items-center gap-2 mt-auto"
        >
          <Camera size={18} />
          Capture Angle {currentAngle + 1}
        </Button>
      </div>
    </div>
  );
};
