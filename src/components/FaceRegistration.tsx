
import { useState, useRef, useEffect } from 'react';
import { Camera, Check, RefreshCw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Builder } from './BuilderCard';
import { registerFaceImage, checkFaceRegistrationStatus, updateBuilderAvatar } from '@/utils/faceRecognition';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface FaceRegistrationProps {
  builder: Builder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const FaceRegistration = ({ builder, open, onOpenChange, onComplete }: FaceRegistrationProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [currentAngle, setCurrentAngle] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get current registration status on load
  useEffect(() => {
    if (open && builder) {
      checkRegistrationStatus();
    }
    
    return () => {
      stopCamera();
    };
  }, [open, builder]);
  
  // Check if builder has already registered face angles
  const checkRegistrationStatus = async () => {
    if (!builder) return;
    
    try {
      const status = await checkFaceRegistrationStatus(builder.id);
      if (status.completed) {
        setRegistrationComplete(true);
        setProgress(100);
      } else {
        setCurrentAngle(status.count);
        setCapturedImages(new Array(status.count).fill(''));
        setProgress((status.count / 5) * 100);
        startCamera();
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError('');
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Unable to access camera. Please check permissions.');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg');
    
    // Register the face image for this angle
    const result = await registerFaceImage(builder.id, imageData, currentAngle);
    
    if (result.success) {
      toast.success(result.message);
      
      // Update captured images and progress
      const newCapturedImages = [...capturedImages];
      newCapturedImages[currentAngle] = imageData;
      setCapturedImages(newCapturedImages);
      
      // If this is the front-facing image (angle 0), update the builder's avatar
      if (currentAngle === 0) {
        await updateBuilderAvatar(builder.id, imageData);
        toast.success("Profile image updated!");
      }
      
      if (result.completed) {
        setRegistrationComplete(true);
        setProgress(100);
        stopCamera();
        onComplete?.();
      } else if (result.imageCount) {
        setCurrentAngle(result.imageCount);
        setProgress((result.imageCount / 5) * 100);
      }
    } else {
      toast.error(result.message);
    }
    
    setProcessing(false);
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
        
        {registrationComplete ? (
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
                  {currentAngle} of 5 angles completed
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
                      index < capturedImages.length && capturedImages[index] 
                        ? 'border-green-500 bg-green-50' 
                        : index === currentAngle 
                          ? 'border-primary animate-pulse' 
                          : 'border-muted bg-muted/50'
                    }`}
                  >
                    {index < capturedImages.length && capturedImages[index] && (
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
