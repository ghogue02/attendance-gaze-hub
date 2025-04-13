
import { useCallback } from 'react';

export function useCameraHealth({
  streamRef,
  isCapturing,
  startCamera,
  stopCamera
}: {
  streamRef: React.RefObject<MediaStream | null>;
  isCapturing: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}) {
  const checkCameraHealth = useCallback(() => {
    if (!streamRef.current) return false;
    
    const videoTracks = streamRef.current.getVideoTracks();
    
    if (!videoTracks || videoTracks.length === 0) return false;
    
    const isActive = videoTracks.some(track => track.readyState === 'live' && track.enabled);
    
    if (!isActive && isCapturing) {
      // Camera appears unhealthy, restart it
      console.warn('Camera appears unhealthy, attempting to restart...');
      stopCamera();
      setTimeout(() => startCamera(), 1000);
      return false;
    }
    
    return isActive;
  }, [isCapturing, startCamera, stopCamera, streamRef]);

  return { checkCameraHealth };
}
