
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
  
  const checkCameraHealth = useCallback(() => {
    if (!stream) return false;
    
    const videoTracks = stream.getVideoTracks();
    
    if (!videoTracks || videoTracks.length === 0) return false;
    
    const isActive = videoTracks.some(track => track.readyState === 'live' && track.enabled);
    
    const now = Date.now();
    if (!isActive && isCapturing && (now - lastRestartAttempt.current > MIN_RESTART_INTERVAL)) {
      // Camera appears unhealthy, restart it (but not too frequently)
      console.warn('Camera appears unhealthy, attempting to restart...');
      lastRestartAttempt.current = now;
      stopCamera();
      // Delay restart to allow proper cleanup
      setTimeout(() => startCamera(), 1500);
      return false;
    }
    
    return isActive;
  }, [isCapturing, startCamera, stopCamera, stream]);

  return { checkCameraHealth };
}
