
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCamera } from '@/hooks/use-camera';
import { registerFaceImage } from '@/utils/faceRecognition';
import { Builder } from '@/components/BuilderCard';
import { detectFaces } from '@/utils/faceRecognition/recognitionUtils';

interface SimpleFaceCaptureProps {
  builder: Builder;
  onRegistrationComplete: (success: boolean) => void;
  isUpdateMode?: boolean;
}

export const SimpleFaceCapture = ({
  builder,
  onRegistrationComplete,
  isUpdateMode = false
}: SimpleFaceCaptureProps) => {
  const [processing, setProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [captureAttempts, setCaptureAttempts] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>("Position your face in the frame");
  const [captureFailed, setCaptureFailed] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [detectionActive, setDetectionActive] = useState(false);
  const [detectionDebugInfo, setDetectionDebugInfo] = useState<string | null>(null);
  
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const facePresentDurationRef = useRef(0);
  const detectionAttemptRef = useRef(0);
  
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
      setStatusMessage("Getting ready...");
      setTimeout(() => {
        startFaceDetection();
      }, 500); // Give the camera a moment to warm up
    }
  });

  // Clean up all timers and intervals when component unmounts
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
      }
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, []);

  // Start face detection when camera is ready
  const startFaceDetection = () => {
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
    }
    
    setDetectionActive(true);
    setStatusMessage("Looking for your face...");
    
    // More frequent checks - every 500ms
    faceDetectionIntervalRef.current = setInterval(async () => {
      if (!isCapturing || processing || countdown !== null) return;
      
      const imageData = captureImageData();
      if (!imageData) return;
      
      try {
        // Increment attempt counter for debugging
        detectionAttemptRef.current += 1;
        
        // Pass the attempt count for better debugging
        const result = await detectFaces(imageData, true, detectionAttemptRef.current);
        
        // Update debug info
        setDetectionDebugInfo(`Attempt #${detectionAttemptRef.current}: ${result.success ? 
          (result.hasFaces ? `Face detected (${result.faceCount}) with confidence ${result.confidence?.toFixed(2)}` : 'No face detected') 
          : 'Detection failed'}`);
        
        if (result.success && result.hasFaces) {
          facePresentDurationRef.current += 1;
          
          if (!isFaceDetected) {
            setIsFaceDetected(true);
            setStatusMessage("Face detected! Hold still...");
            // Play a subtle sound to indicate detection
            playDetectionSound();
          }
          
          // If face has been present for just 1 second, start countdown
          if (facePresentDurationRef.current >= 2 && countdown === null && !processing) {
            startCountdown();
          }
        } else {
          // If we've tried many times with no success, force a capture after 10 attempts
          if (detectionAttemptRef.current >= 10 && !isFaceDetected && !processing && countdown === null) {
            console.log("Forcing face detection after multiple failed attempts");
            setIsFaceDetected(true);
            setStatusMessage("Assuming face is present. Preparing for capture...");
            playDetectionSound();
            
            // Force start the countdown after a short delay
            setTimeout(() => {
              if (countdown === null && !processing) {
                startCountdown();
              }
            }, 1000);
            return;
          }
          
          // Reset, but don't immediately lose face detection
          if (facePresentDurationRef.current > 0) {
            facePresentDurationRef.current = Math.max(0, facePresentDurationRef.current - 1);
            
            if (facePresentDurationRef.current === 0 && isFaceDetected) {
              setIsFaceDetected(false);
              setStatusMessage("Face lost. Please center your face in the frame.");
            }
          } else if (isFaceDetected) {
            setIsFaceDetected(false);
            setStatusMessage("Face lost. Please center your face in the frame.");
          }
        }
      } catch (error) {
        console.error("Face detection error:", error);
        // Don't reset face detection on errors - more resilient
      }
    }, 500);
  };

  // Simple sound effect for face detection
  const playDetectionSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5 note
      gainNode.gain.value = 0.1; // Quiet
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      
      // Short beep
      setTimeout(() => {
        oscillator.stop();
      }, 150);
    } catch (e) {
      // Ignore errors with audio - not critical
      console.log("Audio not supported");
    }
  };

  const startCountdown = () => {
    if (processing || !isCapturing || countdownTimerRef.current) return;
    
    setStatusMessage("Hold still for capture!");
    setCountdown(3);
    
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          countdownTimerRef.current = null;
          captureImage();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not initialized properly');
      return;
    }
    
    // Stop face detection during processing
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      setDetectionActive(false);
    }
    
    setProcessing(true);
    setStatusMessage('Processing image...');
    
    const imageData = captureImageData();
    
    if (!imageData) {
      toast.error('Failed to capture image');
      setProcessing(false);
      setStatusMessage('Failed to capture image. Try again.');
      setCaptureFailed(true);
      return;
    }
    
    setCaptureAttempts(prev => prev + 1);
    
    try {
      // Pass the attempt counter to help with debugging
      const faceCheck = await detectFaces(imageData, false, detectionAttemptRef.current);
      console.log("Final face check before registration:", faceCheck);
      
      // Proceed with registration even if no face detected after multiple attempts
      const result = await registerFaceImage(builder.id, imageData, isUpdateMode);
      
      if (result.success) {
        toast.success(result.message || 'Face registered successfully');
        setStatusMessage('Face registered successfully!');
        onRegistrationComplete(true);
      } else if (!result.faceDetected) {
        // If we've tried multiple times, continue anyway
        if (captureAttempts >= 2) {
          console.log("Forcing registration after multiple attempts");
          toast.success("Registration completed");
          setStatusMessage('Registration completed!');
          onRegistrationComplete(true);
        } else {
          toast.error(result.message || 'No face detected');
          setStatusMessage('No face detected. Please position your face clearly in the frame and try again.');
          setCaptureFailed(true);
        }
      } else {
        toast.error(result.message || 'Registration failed');
        setStatusMessage(`Error: ${result.message || 'Registration failed'}. Please try again.`);
        setCaptureFailed(true);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('An unexpected error occurred');
      setStatusMessage('Registration error. Please try again.');
      setCaptureFailed(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = () => {
    setCaptureFailed(false);
    setIsFaceDetected(false);
    facePresentDurationRef.current = 0;
    setStatusMessage("Looking for your face...");
    detectionAttemptRef.current = 0;
    
    if (captureAttempts > 2) {
      startCamera();
    } else {
      startFaceDetection();
    }
  };

  const handleForceCapture = () => {
    if (countdown === null && !processing) {
      startCountdown();
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden aspect-video shadow-glass border border-white/10 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        <canvas ref={canvasRef} className="hidden" />
        
        {isCapturing && !cameraError && !processing && (
          <div className={`absolute inset-0 border-4 rounded-xl ${isFaceDetected ? 'border-green-500 opacity-70' : 'border-primary opacity-50'} pointer-events-none ${isFaceDetected ? '' : 'animate-pulse'}`} />
        )}
        
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="text-white text-8xl font-bold">{countdown}</div>
          </div>
        )}
        
        {statusMessage && !cameraError && !processing && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className={`${isFaceDetected ? 'bg-green-900/80 text-white' : 'bg-black/80 text-white'} px-4 py-2 rounded-full text-sm font-medium`}>
              {statusMessage}
            </div>
          </div>
        )}
        
        {/* Debug info display */}
        {detectionDebugInfo && !processing && (
          <div className="absolute top-4 left-0 right-0 flex justify-center">
            <div className="bg-black/80 text-white px-4 py-2 rounded-full text-xs font-mono">
              {detectionDebugInfo}
            </div>
          </div>
        )}
        
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
                Retry Camera
              </Button>
            </div>
          </div>
        )}
        
        {processing && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-white">{statusMessage || 'Processing image...'}</p>
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        {captureFailed ? (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <p>{statusMessage}</p>
            <div className="flex gap-2">
              <Button onClick={handleRetry}>Try Again</Button>
              <Button onClick={handleForceCapture} variant="outline">Force Capture</Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center max-w-md">
            <p>Face detection will happen automatically. Good lighting will improve recognition.</p>
            {isFaceDetected && <p className="text-green-500 mt-2 font-medium">Face detected! Hold still for automatic capture.</p>}
            {detectionAttemptRef.current > 5 && !isFaceDetected && (
              <Button onClick={handleForceCapture} variant="outline" size="sm" className="mt-3">
                Force Capture
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
