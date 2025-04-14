
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

  // Add a ref to track camera activation state to prevent reinitialization
  const activationRef = useRef(false);
  const startInProgressRef = useRef(false);

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
  });
  
  // Wrap startCamera to include constraints and prevent redundant calls
  const startCamera = useCallback(() => {
    if (startInProgressRef.current) {
      console.log("Camera start already in progress, skipping redundant request");
      return Promise.resolve();
    }
    
    startInProgressRef.current = true;
    
    return startCameraBase(videoConstraints)
      .finally(() => {
        startInProgressRef.current = false;
      });
  }, [startCameraBase, videoConstraints]);

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
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      if (activationRef.current) {
        stopCamera();
        activationRef.current = false;
      }
    };
  }, [isCameraActive, startCamera, stopCamera]);

  // Periodically check camera health - but at a reduced frequency
  useEffect(() => {
    if (!isCameraActive) return;
    
    const intervalId = setInterval(() => {
      checkCameraHealth();
    }, 10000); // Check every 10 seconds - increased from 5 to reduce frequency
    
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
