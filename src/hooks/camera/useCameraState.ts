
import { useState, useRef } from 'react';
import type { MediaStream } from './types';

export function useCameraState() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [initialized, setInitialized] = useState(false);
  
  // We use these refs for backward compatibility
  const streamRef = useRef<MediaStream | null>(null);
  const retryCountRef = useRef(0);
  const initializedRef = useRef(false);
  
  // Sync the refs with state when state changes
  if (streamRef.current !== stream) {
    streamRef.current = stream;
  }
  
  if (retryCountRef.current !== retryCount) {
    retryCountRef.current = retryCount;
  }
  
  if (initializedRef.current !== initialized) {
    initializedRef.current = initialized;
  }
  
  return {
    // State values
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
    setInitialized,
    
    // Refs (for backward compatibility)
    streamRef,
    retryCountRef,
    initializedRef
  };
}
