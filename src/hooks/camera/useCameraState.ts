
import { useState, useRef } from 'react';
import type { MediaStream } from './types';

export function useCameraState() {
  // State values
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [initialized, setInitialized] = useState(false);
  
  // Refs that don't need updating with state
  const videoRef = useRef<HTMLVideoElement>(null);
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const retryCountRef = useRef(0);
  const initializedRef = useRef(false);
  
  // Use an effect-like pattern that doesn't violate React rules
  // This will be called during render but won't cause updates during render
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
