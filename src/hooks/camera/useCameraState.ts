
import { useState, useRef } from 'react';
import type { MediaStream } from './types';

export function useCameraState() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const retryCountRef = useRef(0);
  const initializedRef = useRef(false);
  
  return {
    isCapturing,
    setIsCapturing,
    cameraError,
    setCameraError,
    videoRef,
    internalCanvasRef,
    streamRef,
    retryCountRef,
    initializedRef
  };
}
