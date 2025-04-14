
import { useCallback } from 'react';
import { stopMediaStreamTracks, getCameraErrorMessage, mergeConstraints } from './utils';
import type { CameraConstraints } from './types';

export function useCameraStart({
  videoRef,
  setStream,
  stream,
  setRetryCount,
  retryCount,
  setInitialized,
  initialized,
  setIsCapturing,
  setCameraError,
  onCameraStart,
  startInProgressRef
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  setStream: (stream: MediaStream | null) => void;
  stream: MediaStream | null;
  setRetryCount: (count: number) => void;
  retryCount: number;
  setInitialized: (initialized: boolean) => void;
  initialized: boolean;
  setIsCapturing: (isCapturing: boolean) => void;
  setCameraError: (error: string) => void;
  onCameraStart?: () => void;
  startInProgressRef: React.MutableRefObject<boolean>;
}) {
  const maxRetries = 2; // Reduced from 3 to 2
  
  // Create a function that handles camera initialization
  const startCamera = useCallback(async (videoConstraints: CameraConstraints = {}) => {
    // Return early if already capturing to prevent loops
    if (stream && videoRef.current?.srcObject === stream) {
      console.log("Camera already initialized with same stream, skipping redundant start");
      return;
    }
    
    try {
      setCameraError('');
      
      // First, make sure any previous streams are stopped
      if (stream) {
        stopMediaStreamTracks(stream);
        setStream(null);
      }
      
      // Set capturing state to true before starting
      setIsCapturing(true);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }
      
      // Merge default with provided constraints
      const constraints = mergeConstraints(videoConstraints);
      
      console.log("Requesting camera access...");
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log("Camera access granted successfully");
      
      // Store the stream and set it as the video source
      setStream(mediaStream);
      
      if (videoRef.current) {
        // Make sure video element is ready
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready before notifying
        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) return;
          
          console.log("Camera ready with resolution:", 
            videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
            
          // Reset retry counter on success
          setRetryCount(0);
          
          // Set initialized to true
          if (!initialized) {
            setInitialized(true);
          }
            
          // Make sure video plays
          videoRef.current.play()
            .then(() => {
              if (onCameraStart) {
                onCameraStart();
              }
            })
            .catch(playError => {
              console.error("Error starting video playback:", playError);
              setCameraError("Failed to start video playback. Please reload the page or check browser permissions.");
              setIsCapturing(false);
            });
        };
        
        // Add error handler
        videoRef.current.onerror = (err) => {
          console.error("Video element error:", err);
          setCameraError("Video element error. Please reload the page.");
          setIsCapturing(false);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      const errorMessage = getCameraErrorMessage(err);
      
      setCameraError(errorMessage);
      setIsCapturing(false);
      
      // Auto-retry logic with backoff, but only if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        const delay = 2000 * Math.pow(2, newRetryCount); // Increased exponential backoff
        console.log(`Retrying camera initialization in ${delay/1000} seconds (attempt ${newRetryCount} of ${maxRetries})...`);
        
        // Prevent new start attempts during the retry delay
        if (startInProgressRef) {
          // Fix: Use a timeout to update the ref value instead of directly updating it
          setTimeout(() => {
            startInProgressRef.current = false;
          }, delay - 500);
        }
        
        setTimeout(() => {
          startCamera(videoConstraints);
        }, delay);
      } else {
        // Clear in-progress state after max retries
        if (startInProgressRef) {
          // Fix: Use a timeout to update the ref value instead of directly updating it
          setTimeout(() => {
            startInProgressRef.current = false;
          }, 0);
        }
      }
    }
  }, [setCameraError, setIsCapturing, onCameraStart, setStream, stream, videoRef, initialized, setInitialized, retryCount, setRetryCount, startInProgressRef]);

  return { startCamera };
}
