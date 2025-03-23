
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
    }
  }, [videoConstraints, onCameraStart]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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
    
    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // For optimal performance, use a lower quality JPEG
    try {
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (err) {
      console.error('Error converting canvas to data URL:', err);
      return null;
    }
  }, []);

  return {
    videoRef,
    canvasRef,
    isCapturing,
    cameraError,
    startCamera,
    stopCamera,
    captureImageData
  };
}
