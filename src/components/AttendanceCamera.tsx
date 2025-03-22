
import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Student, StudentStatus } from './StudentCard';
import { recognizeFace } from '@/utils/faceRecognition';
import { Button } from './ui/button';

interface AttendanceCameraProps {
  onStudentDetected?: (student: Student) => void;
  isCameraActive?: boolean;
  passive?: boolean; // New passive mode prop
  passiveInterval?: number; // How often to scan in passive mode (ms)
}

const AttendanceCamera = ({ 
  onStudentDetected, 
  isCameraActive = false,
  passive = false,
  passiveInterval = 5000 // 5 second default interval
}: AttendanceCameraProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [processingImage, setProcessingImage] = useState(false);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const passiveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isCameraActive]);

  // Set up passive mode interval
  useEffect(() => {
    if (passive && isCapturing && !processingImage) {
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
      
      // Initial passive capture if in passive mode
      if (passive) {
        // Small delay to make sure video is initialized
        setTimeout(() => {
          captureImagePassive();
        }, 1000);
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
    
    if (passiveTimeoutRef.current) {
      clearTimeout(passiveTimeoutRef.current);
    }
    
    setIsCapturing(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setProcessingImage(true);
    processCapturedImage(false);
  };
  
  const captureImagePassive = () => {
    if (!videoRef.current || !canvasRef.current || processingImage) return;
    
    // Don't show processing UI in passive mode
    processCapturedImage(true);
  };
  
  const processCapturedImage = (isPassive: boolean) => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg');
    
    // In passive mode, don't show UI feedback unless successful
    if (!isPassive) {
      setProcessingImage(true);
    }
    
    recognizeFace(imageData, isPassive).then(result => {
      if (result.success && result.student) {
        onStudentDetected?.(result.student);
        
        if (isPassive) {
          // Only show toast in passive mode on success
          toast.success(`Attendance recorded: ${result.student.name}`);
        } else {
          toast.success(result.message);
        }
        
        // Update last detection time to prevent constant detections
        setLastDetectionTime(Date.now());
      } else if (!isPassive) {
        // Only show error messages in active mode
        toast.error(result.message);
      }
      
      if (!isPassive) {
        setProcessingImage(false);
      }
    }).catch(error => {
      console.error('Face recognition error:', error);
      
      if (!isPassive) {
        toast.error('An error occurred during face recognition');
        setProcessingImage(false);
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative rounded-2xl overflow-hidden aspect-video shadow-glass border border-white/10 bg-black">
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
        
        <div className="absolute top-3 right-3">
          <div className={`h-3 w-3 rounded-full ${isCapturing ? 'bg-green-500' : 'bg-red-500'}`}>
            <div className={`h-3 w-3 rounded-full ${isCapturing ? 'bg-green-500' : 'bg-red-500'} animate-ping opacity-75`} />
          </div>
        </div>
        
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center">
            <div>
              <p className="mb-3">{cameraError}</p>
              <Button
                onClick={startCamera}
                className="flex items-center gap-2 text-sm mx-auto"
                variant="secondary"
              >
                <RefreshCw size={16} />
                Retry
              </Button>
            </div>
          </div>
        )}
        
        <AnimatePresence>
          {processingImage && (
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
              <p className="text-white">Analyzing face...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {!passive && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={captureImage}
            disabled={!isCapturing || processingImage}
            className={`flex items-center gap-2 ${
              (!isCapturing || processingImage) && 'opacity-50 cursor-not-allowed'
            }`}
          >
            <Camera size={18} />
            <span>Capture Attendance</span>
          </Button>
        </div>
      )}
      
      {passive && (
        <div className="mt-2 text-center text-sm text-muted-foreground">
          <p>Passive recognition active. Just look at the camera.</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceCamera;
