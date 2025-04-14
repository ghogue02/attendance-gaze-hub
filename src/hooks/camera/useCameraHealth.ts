
import { useCallback, useRef } from 'react';

export function useCameraHealth({
  stream,
  isCapturing,
  startCamera,
  stopCamera
}: {
  stream: MediaStream | null;
  isCapturing: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}) {
  // Add a ref to track the last time we tried to restart the camera
  const lastRestartAttempt = useRef<number>(0);
  // Add a minimum time between restart attempts (30 seconds)
  const MIN_RESTART_INTERVAL = 30000;
  // Add a counter to track consecutive health check failures
  const healthCheckFailCount = useRef<number>(0);
  // Minimum failures before restarting
  const MIN_FAILURES_BEFORE_RESTART = 3;
  
  const checkCameraHealth = useCallback(() => {
    if (!stream) return false;
    
    const videoTracks = stream.getVideoTracks();
    
    if (!videoTracks || videoTracks.length === 0) return false;
    
    const isActive = videoTracks.some(track => track.readyState === 'live' && track.enabled);
    
    const now = Date.now();
    
    // Update health check counter
    if (!isActive && isCapturing) {
      healthCheckFailCount.current += 1;
    } else {
      // Reset failure count on success
      healthCheckFailCount.current = 0;
      return isActive;
    }
    
    // Only restart if we've had multiple consecutive failures AND enough time has passed
    if (
      healthCheckFailCount.current >= MIN_FAILURES_BEFORE_RESTART && 
      isCapturing && 
      (now - lastRestartAttempt.current > MIN_RESTART_INTERVAL)
    ) {
      // Camera appears unhealthy, restart it (but not too frequently)
      console.warn(`Camera appears unhealthy after ${healthCheckFailCount.current} checks, attempting to restart...`);
      lastRestartAttempt.current = now;
      healthCheckFailCount.current = 0;
      
      // Stop the camera
      stopCamera();
      
      // Delay restart to allow proper cleanup
      setTimeout(() => startCamera(), 1500);
      return false;
    }
    
    return isActive;
  }, [isCapturing, startCamera, stopCamera, stream]);

  return { checkCameraHealth };
}
