
import { useState, useRef, useEffect } from 'react';
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
  
  // Use useEffect to update refs when state changes instead of during render
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);
  
  useEffect(() => {
    retryCountRef.current = retryCount;
  }, [retryCount]);
  
  useEffect(() => {
    initializedRef.current = initialized;
  }, [initialized]);
  
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
