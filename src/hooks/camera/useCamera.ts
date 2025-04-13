
import { useEffect, useCallback, RefObject } from 'react';
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
    streamRef,
    retryCountRef,
    initializedRef
  } = useCameraState();
  
  // Use provided canvas ref or our internal one
  const canvasRef = externalCanvasRef || internalCanvasRef;

  // Setup camera start functionality
  const { startCamera: startCameraBase } = useCameraStart({
    videoRef,
    streamRef,
    retryCountRef,
    initializedRef,
    setIsCapturing,
    setCameraError,
    onCameraStart,
  });
  
  // Wrap startCamera to include constraints
  const startCamera = useCallback(() => {
    return startCameraBase(videoConstraints);
  }, [startCameraBase, videoConstraints]);

  // Setup camera stop functionality
  const { stopCamera } = useCameraStop({
    videoRef,
    streamRef,
    setIsCapturing,
    onCameraStop,
  });
  
  // Setup camera health monitoring
  const { checkCameraHealth } = useCameraHealth({
    streamRef,
    isCapturing,
    startCamera,
    stopCamera
  });

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

  // Periodically check camera health
  useEffect(() => {
    if (!isCameraActive) return;
    
    const intervalId = setInterval(() => {
      checkCameraHealth();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [isCameraActive, checkCameraHealth]);

  // Capture the current frame from the video stream
  const captureImageData = useCallback((): string | null => {
    console.log("Capturing image from video...", {
      videoRefExists: !!videoRef.current,
      canvasRefExists: !!canvasRef.current
    });
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
