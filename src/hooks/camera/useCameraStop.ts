
import { useCallback } from 'react';
import { stopMediaStreamTracks } from './utils';

export function useCameraStop({
  videoRef,
  stream,
  setStream,
  setIsCapturing,
  onCameraStop
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  setStream: (stream: MediaStream | null) => void;
  setIsCapturing: (isCapturing: boolean) => void;
  onCameraStop?: () => void;
}) {
  const stopCamera = useCallback(() => {
    if (stream) {
      stopMediaStreamTracks(stream);
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
    }
    
    setIsCapturing(false);
    onCameraStop?.();
  }, [onCameraStop, setIsCapturing, stream, setStream, videoRef]);

  return { stopCamera };
}
