
import { useCallback } from 'react';
import { stopMediaStreamTracks } from './utils';

export function useCameraStop({
  videoRef,
  streamRef,
  setIsCapturing,
  onCameraStop
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  streamRef: React.RefObject<MediaStream | null>;
  setIsCapturing: (isCapturing: boolean) => void;
  onCameraStop?: () => void;
}) {
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      stopMediaStreamTracks(streamRef.current);
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
    }
    
    setIsCapturing(false);
    onCameraStop?.();
  }, [onCameraStop, setIsCapturing, streamRef, videoRef]);

  return { stopCamera };
}
