
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
  // Add a minimum time between restart attempts (increased to 2 minutes)
  const MIN_RESTART_INTERVAL = 120000; // 2 minutes
  // Add a counter to track consecutive health check failures
  const healthCheckFailCount = useRef<number>(0);
  // Minimum failures before restarting
  const MIN_FAILURES_BEFORE_RESTART = 8; // Increased from 5 to 8
  // Last time the camera was confirmed healthy
  const lastHealthyTime = useRef<number>(Date.now());
  
  const checkCameraHealth = useCallback(() => {
    if (!stream) return false;
    
    const videoTracks = stream.getVideoTracks();
    
    if (!videoTracks || videoTracks.length === 0) return false;
    
    const isActive = videoTracks.some(track => track.readyState === 'live' && track.enabled);
    
    const now = Date.now();
    
    // Update health check counter
    if (!isActive && isCapturing) {
      healthCheckFailCount.current += 1;
      console.log(`Camera health check failed (${healthCheckFailCount.current} consecutive failures)`);
    } else {
      // Reset failure count on success and update healthy timestamp
      if (healthCheckFailCount.current > 0) {
        console.log("Camera health check passed, resetting failure counter");
      }
      healthCheckFailCount.current = 0;
      lastHealthyTime.current = now;
      return isActive;
    }
    
    // Check if camera has been unhealthy for too long (8 minutes - increased from 5)
    const unhealthyDuration = now - lastHealthyTime.current;
    const isLongTermUnhealthy = unhealthyDuration > 480000; // 8 minutes
    
    // Only restart if we've had multiple consecutive failures AND enough time has passed
    // OR if the camera has been unhealthy for an extended period
    if (
      (healthCheckFailCount.current >= MIN_FAILURES_BEFORE_RESTART && 
      isCapturing && 
      (now - lastRestartAttempt.current > MIN_RESTART_INTERVAL)) ||
      isLongTermUnhealthy
    ) {
      // Camera appears unhealthy, restart it (but not too frequently)
      console.warn(`Camera appears unhealthy after ${healthCheckFailCount.current} checks or ${Math.round(unhealthyDuration/1000)}s, attempting to restart...`);
      lastRestartAttempt.current = now;
      healthCheckFailCount.current = 0;
      
      // Stop the camera
      stopCamera();
      
      // Delay restart to allow proper cleanup
      setTimeout(() => startCamera(), 3000); // Increased delay to 3 seconds
      return false;
    }
    
    return isActive;
  }, [isCapturing, startCamera, stopCamera, stream]);

  return { checkCameraHealth };
}
