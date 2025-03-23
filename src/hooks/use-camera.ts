
import { useState, useRef, useEffect, useCallback } from 'react';

interface CameraConstraints {
  facingMode?: 'user' | 'environment';
  width?: { min?: number; ideal?: number; max?: number };
  height?: { min?: number; ideal?: number; max?: number };
  frameRate?: { min?: number; ideal?: number; max?: number };
  aspectRatio?: number;
}

interface UseCameraProps {
  onCameraStart?: () => void;
  onCameraStop?: () => void;
  isCameraActive?: boolean;
  videoConstraints?: CameraConstraints;
}

export function useCamera({ 
  onCameraStart, 
  onCameraStop, 
  isCameraActive = false,
  videoConstraints = {}
}: UseCameraProps = {}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Memoize the start camera function to avoid recreating it on each render
  const startCamera = useCallback(async () => {
    try {
      setCameraError('');
      
      // First, make sure any previous streams are stopped
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Set capturing state to true before starting
      setIsCapturing(true);
      
      console.log("Starting camera with constraints:", videoConstraints);
      
      // Default constraints
      const defaultConstraints: CameraConstraints = {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      };
      
      // Merge default with provided constraints
      const constraints = {
        ...defaultConstraints,
        ...videoConstraints
      };
      
      // Try to get access to the camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: constraints,
        audio: false
      });
      
      // Store the stream and set it as the video source
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready before notifying
        videoRef.current.onloadedmetadata = () => {
          console.log("Camera ready with resolution:", 
            videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
            
          // Reset retry counter on success
          retryCountRef.current = 0;
            
          // Make sure video plays
          videoRef.current?.play()
            .then(() => {
              console.log("Video playback started successfully");
              onCameraStart?.();
            })
            .catch(playError => {
              console.error("Error starting video playback:", playError);
              setCameraError("Failed to start video playback. Please reload the page.");
              setIsCapturing(false);
            });
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      let errorMessage = 'Unable to access camera. Please check permissions.';
      
      // More specific error messages
      if (err instanceof DOMException) {
        if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please make sure your device has a camera.';
        } else if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera access in your browser settings.';
        } else if (err.name === 'AbortError') {
          errorMessage = 'Camera setup was aborted. Please try again.';
        }
      }
      
      setCameraError(errorMessage);
      setIsCapturing(false);
      
      // Auto-retry logic with backoff
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = 1000 * retryCountRef.current; // Increasing delay for each retry
        console.log(`Retrying camera initialization in ${delay/1000} seconds (attempt ${retryCountRef.current} of ${maxRetries})...`);
        
        setTimeout(() => {
          console.log("Auto-retrying camera initialization...");
          startCamera();
        }, delay);
      }
    }
  }, [videoConstraints, onCameraStart]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}, enabled: ${track.enabled}, state: ${track.readyState}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
    onCameraStop?.();
  }, [onCameraStop]);

  // Start or stop camera based on isCameraActive prop
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isCameraActive, startCamera, stopCamera]);

  // Capture the current frame from the video stream
  const captureImageData = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas reference not available');
      return null;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('Canvas context not available');
      return null;
    }
    
    // Set canvas to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (canvas.width === 0 || canvas.height === 0) {
      console.error('Invalid video dimensions:', canvas.width, 'x', canvas.height);
      return null;
    }
    
    // Check if video is playing and ready
    if (video.readyState !== 4) {
      console.error('Video is not ready for capture, readyState:', video.readyState);
      return null;
    }
    
    try {
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // For optimal performance, use a lower quality JPEG
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (err) {
      console.error('Error converting canvas to data URL:', err);
      return null;
    }
  }, []);

  // Add function to check if camera is healthy
  const checkCameraHealth = useCallback(() => {
    if (!streamRef.current) return false;
    
    const videoTracks = streamRef.current.getVideoTracks();
    
    if (!videoTracks || videoTracks.length === 0) return false;
    
    const isActive = videoTracks.some(track => track.readyState === 'live' && track.enabled);
    
    if (!isActive && isCapturing) {
      // Camera appears unhealthy, restart it
      console.warn('Camera appears unhealthy, attempting to restart...');
      stopCamera();
      setTimeout(() => startCamera(), 500);
      return false;
    }
    
    return isActive;
  }, [isCapturing, startCamera, stopCamera]);

  // Periodically check camera health
  useEffect(() => {
    if (!isCameraActive) return;
    
    const intervalId = setInterval(() => {
      checkCameraHealth();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [isCameraActive, checkCameraHealth]);

  return {
    videoRef,
    canvasRef,
    isCapturing,
    cameraError,
    startCamera,
    stopCamera,
    captureImageData,
    checkCameraHealth
  };
}
