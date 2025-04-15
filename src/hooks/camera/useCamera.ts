
import { useEffect, useCallback, useRef } from 'react';
import { UseCameraProps, UseCameraReturn } from './types';
import { useCameraState } from './useCameraState';
import { useCameraStart } from './useCameraStart';
import { useCameraStop } from './useCameraStop';
import { useCameraHealth } from './useCameraHealth';
import { captureImageFromVideo } from './captureImage';

export function useCamera({ 
  onCameraStart, 
  onCameraStop, 
  isCameraActive = false,
  videoConstraints = {},
  canvasRef: externalCanvasRef
}: UseCameraProps = {}): UseCameraReturn {
  const {
    isCapturing,
    setIsCapturing,
    cameraError,
    setCameraError,
    videoRef,
    internalCanvasRef,
    stream,
    setStream,
    retryCount,
    setRetryCount,
    initialized,
    setInitialized
  } = useCameraState();
  
  // Use provided canvas ref or our internal one
  const canvasRef = externalCanvasRef || internalCanvasRef;

  // Add refs to track camera activation state to prevent reinitialization
  const activationRef = useRef(false);
  const startInProgressRef = useRef(false);
  const activationAttemptCountRef = useRef(0);
  const lastActivationAttemptRef = useRef(0);

  // Setup camera start functionality
  const { startCamera: startCameraBase } = useCameraStart({
    videoRef,
    stream,
    setStream,
    retryCount,
    setRetryCount,
    initialized,
    setInitialized,
    setIsCapturing,
    setCameraError,
    onCameraStart,
    startInProgressRef
  });
  
  // Wrap startCamera to include constraints and prevent redundant calls
  const startCamera = useCallback(() => {
    const now = Date.now();
    
    // Don't allow more than 2 activation attempts per second (reduced from 3)
    if (now - lastActivationAttemptRef.current < 1000) {
      activationAttemptCountRef.current += 1;
      
      if (activationAttemptCountRef.current > 2) {
        console.warn("Too many camera activation attempts in short succession, throttling");
        return Promise.resolve();
      }
    } else {
      // Reset counter if more than a second has passed
      activationAttemptCountRef.current = 1;
      lastActivationAttemptRef.current = now;
    }
    
    if (startInProgressRef.current) {
      console.log("Camera start already in progress, skipping redundant request");
      return Promise.resolve();
    }
    
    // If camera is already successfully capturing, don't restart
    if (stream && videoRef.current?.srcObject === stream && isCapturing) {
      console.log("Camera already active and capturing, skipping redundant activation");
      return Promise.resolve();
    }
    
    startInProgressRef.current = true;
    
    return startCameraBase(videoConstraints)
      .finally(() => {
        setTimeout(() => {
          startInProgressRef.current = false;
        }, 1000); // Increased delay to prevent rapid consecutive attempts
      });
  }, [startCameraBase, videoConstraints, stream, videoRef, isCapturing]);

  // Setup camera stop functionality
  const { stopCamera } = useCameraStop({
    videoRef,
    stream,
    setStream,
    setIsCapturing,
    onCameraStop,
  });
  
  // Setup camera health monitoring
  const { checkCameraHealth } = useCameraHealth({
    stream,
    isCapturing,
    startCamera,
    stopCamera
  });

  // Start or stop camera based on isCameraActive prop
  useEffect(() => {
    // Track current activation to prevent setting up infinite loop
    if (isCameraActive === activationRef.current) {
      return;
    }
    
    activationRef.current = isCameraActive;
    
    if (isCameraActive) {
      // Add small delay to prevent rapid initialization attempts
      const timer = setTimeout(() => {
        startCamera();
      }, 300); // Increased delay to 300ms
      
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [isCameraActive, startCamera, stopCamera]);

  // Periodically check camera health - but at a reduced frequency
  useEffect(() => {
    if (!isCameraActive) return;
    
    const intervalId = setInterval(() => {
      checkCameraHealth();
    }, 30000); // Reduced frequency from 15s to 30s
    
    return () => clearInterval(intervalId);
  }, [isCameraActive, checkCameraHealth]);

  // Capture the current frame from the video stream
  const captureImageData = useCallback((): string | null => {
    return captureImageFromVideo(videoRef, canvasRef);
  }, [canvasRef, videoRef]);

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
