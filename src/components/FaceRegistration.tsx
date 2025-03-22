import { useState, useRef, useEffect } from 'react';
import { Camera, Check, RefreshCw, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Builder } from './BuilderCard';
import { registerFaceImage, checkFaceRegistrationStatus, updateBuilderAvatar } from '@/utils/faceRecognition';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useCamera } from '@/hooks/use-camera';

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
  
  const {
    videoRef,
    canvasRef,
    isCapturing,
    cameraError,
    startCamera,
    stopCamera,
    captureImageData
  } = useCamera({
    isCameraActive: open && !registrationComplete,
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
      
      if (result.completed) {
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
    startCamera();
  };

  const angleInstructions = [
    "Look directly at the camera",
    "Turn your head slightly to the left",
    "Turn your head slightly to the right",
    "Tilt your head slightly up",
    "Tilt your head slightly down",
  ];

  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Face Registration</DialogTitle>
          <DialogDescription>
            Please register your face from multiple angles to improve recognition accuracy.
          </DialogDescription>
        </DialogHeader>
        
        {registrationComplete && !isUpdateMode ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Registration Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Your face has been successfully registered from all required angles.
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
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative rounded-xl overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              <canvas ref={canvasRef} className="hidden" />
              
              {isCapturing && !cameraError && (
                <div className="absolute inset-0 border-2 border-primary pointer-events-none animate-pulse opacity-50" />
              )}
              
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center">
                  <div>
                    <p className="mb-3">{cameraError}</p>
                    <Button
                      onClick={startCamera}
                      className="flex items-center gap-2 text-sm mx-auto"
                    >
                      <RefreshCw size={16} />
                      Retry
                    </Button>
                  </div>
                </div>
              )}
              
              <AnimatePresence>
                {processing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center"
                  >
                    <svg className="animate-spin h-10 w-10 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-white">Processing image...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Registration Progress</h3>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.min(capturedImages.filter(Boolean).length, 5)} of 5 angles completed
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2">Current Angle</h4>
                <div className="flex items-center text-primary mb-1">
                  <ChevronRight size={16} className="mr-1" />
                  <p className="text-sm">{angleInstructions[currentAngle]}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Position your face within the frame and follow the instructions.
                </p>
              </div>
              
              <div className="grid grid-cols-5 gap-2 mb-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div 
                    key={index}
                    className={`aspect-square rounded-md border-2 ${
                      capturedImages[index] 
                        ? 'border-green-500 bg-green-50' 
                        : index === currentAngle 
                          ? 'border-primary animate-pulse' 
                          : 'border-muted bg-muted/50'
                    }`}
                  >
                    {capturedImages[index] && (
                      <div className="h-full w-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FaceRegistration;
