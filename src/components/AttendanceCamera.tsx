
import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Student } from './StudentCard';

interface AttendanceCameraProps {
  onStudentDetected?: (student: Student) => void;
  isCameraActive?: boolean;
}

const AttendanceCamera = ({ onStudentDetected, isCameraActive = false }: AttendanceCameraProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [processingImage, setProcessingImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start and stop video capture based on isCameraActive
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

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setProcessingImage(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Ensure canvas dimensions match video dimensions for proper scaling
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg');
    
    // Simulate processing the image for face recognition
    // In a real implementation, this would send the image to your face recognition service
    setTimeout(() => {
      // Simulate successful recognition
      if (Math.random() > 0.3) { // 70% chance of success for demo
        const mockStudent: Student = {
          id: '1234',
          name: 'Alex Johnson',
          studentId: 'S' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
          status: 'present',
          timeRecorded: new Date().toLocaleTimeString(),
          image: imageData
        };
        
        onStudentDetected?.(mockStudent);
        toast.success('Student successfully recognized!');
      } else {
        // Simulate failed recognition
        toast.error('No student recognized. Try again.');
      }
      
      setProcessingImage(false);
    }, 1500);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative rounded-2xl overflow-hidden aspect-video shadow-glass border border-white/10 bg-black">
        {/* Main video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Canvas for capturing frames (hidden) */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlay with scanning effect */}
        {isCapturing && !cameraError && (
          <div className="absolute inset-0 border-2 border-primary pointer-events-none animate-pulse opacity-50" />
        )}
        
        {/* Status indicators */}
        <div className="absolute top-3 right-3">
          <div className={`h-3 w-3 rounded-full ${isCapturing ? 'bg-green-500' : 'bg-red-500'}`}>
            <div className={`h-3 w-3 rounded-full ${isCapturing ? 'bg-green-500' : 'bg-red-500'} animate-ping opacity-75`} />
          </div>
        </div>
        
        {/* Camera error message */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center">
            <div>
              <p className="mb-3">{cameraError}</p>
              <button
                onClick={startCamera}
                className="btn-primary flex items-center gap-2 text-sm mx-auto"
              >
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          </div>
        )}
        
        {/* Processing overlay */}
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
      
      {/* Camera controls */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={captureImage}
          disabled={!isCapturing || processingImage}
          className={`btn-primary flex items-center gap-2 ${
            (!isCapturing || processingImage) && 'opacity-50 cursor-not-allowed'
          }`}
        >
          <Camera size={18} />
          <span>Capture Attendance</span>
        </button>
      </div>
    </div>
  );
};

export default AttendanceCamera;
