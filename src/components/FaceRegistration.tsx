
import { useState, useRef, useEffect } from 'react';
import { Camera, Check, RefreshCw, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Builder } from './BuilderCard';
import { registerFaceImage, checkFaceRegistrationStatus, updateBuilderAvatar } from '@/utils/faceRecognition';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useCamera } from '@/hooks/use-camera';
import { SimpleFaceCapture } from './face-registration/SimpleFaceCapture';

interface FaceRegistrationProps {
  builder: Builder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const FaceRegistration = ({ builder, open, onOpenChange, onComplete }: FaceRegistrationProps) => {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [showSimpleCapture, setShowSimpleCapture] = useState(true);

  const {
    videoRef,
    canvasRef,
    isCapturing,
    cameraError,
    startCamera,
    stopCamera,
    captureImageData
  } = useCamera({
    isCameraActive: open && !registrationComplete && !showSimpleCapture,
    videoConstraints: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  });

  useEffect(() => {
    if (open && builder) {
      checkRegistrationStatus();
    }
    
    return () => {
      stopCamera();
    };
  }, [open, builder]);
  
  const checkRegistrationStatus = async () => {
    if (!builder) return;
    
    try {
      const status = await checkFaceRegistrationStatus(builder.id);
      console.log("Registration status:", status);
      
      if (status.completed) {
        setRegistrationComplete(true);
        setProgress(100);
        setIsUpdateMode(status.count >= 5);
      } else {
        setCurrentAngle(status.count);
        setCapturedImages(new Array(status.count).fill(''));
        setProgress((status.count / 5) * 100);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

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
    
    const result = await registerFaceImage(builder.id, imageData, isUpdateMode);
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
      
      if (result.completed && !isUpdateMode) {
        console.log("Registration complete!");
        setRegistrationComplete(true);
        setProgress(100);
        stopCamera();
      } else if (result.imageCount) {
        if (result.nextAngleIndex !== undefined) {
          setCurrentAngle(result.nextAngleIndex);
        } else {
          setCurrentAngle(prev => (prev + 1) % 5);
        }
        setProgress((result.imageCount / 5) * 100);
        
        if (result.completed && isUpdateMode && result.nextAngleIndex === 0) {
          console.log("Update complete!");
          setRegistrationComplete(true);
          setProgress(100);
          stopCamera();
        }
      }
    } else {
      toast.error(result.message);
    }
    
    setProcessing(false);
  };

  const handleStartOver = () => {
    setCurrentAngle(0);
    setRegistrationComplete(false);
    setCapturedImages([]);
    setProgress(0);
    setShowSimpleCapture(true);
  };

  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
  };

  const handleSimpleCaptureComplete = (success: boolean) => {
    if (success) {
      checkRegistrationStatus();
      setRegistrationComplete(true);
      setShowSimpleCapture(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Face Registration</DialogTitle>
          <DialogDescription>
            Please register your face to improve recognition accuracy.
          </DialogDescription>
        </DialogHeader>
        
        {registrationComplete && !isUpdateMode ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Registration Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Your face has been successfully registered.
            </p>
            <Button onClick={handleComplete}>
              Done
            </Button>
          </div>
        ) : registrationComplete && isUpdateMode ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Update Registration</h3>
            <p className="text-muted-foreground mb-6">
              You've already completed face registration, but you can update your images 
              to improve recognition accuracy.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleComplete}>
                Cancel
              </Button>
              <Button onClick={handleStartOver}>
                Re-register Face
              </Button>
            </div>
          </div>
        ) : showSimpleCapture ? (
          <SimpleFaceCapture 
            builder={builder}
            onRegistrationComplete={handleSimpleCaptureComplete}
            isUpdateMode={isUpdateMode}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default FaceRegistration;
