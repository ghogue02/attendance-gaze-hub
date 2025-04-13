
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
  onCameraStart
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
}) {
  const maxRetries = 5;
  
  // Memoize the start camera function to avoid recreating it on each render
  const startCamera = useCallback(async (videoConstraints: CameraConstraints = {}) => {
    try {
      setCameraError('');
      
      // First, make sure any previous streams are stopped
      if (stream) {
        stopMediaStreamTracks(stream);
        setStream(null);
      }
      
      // Set capturing state to true before starting
      setIsCapturing(true);
      
      console.log("Starting camera with constraints:", videoConstraints);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }
      
      // Merge default with provided constraints
      const constraints = mergeConstraints(videoConstraints);
      
      // Add a small delay before accessing camera to allow previous instances to clean up
      if (initialized) {
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        setInitialized(true);
      }
      
      // Try to get access to the camera
      console.log("Requesting camera access...");
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log("Camera access granted successfully");
      
      // Store the stream and set it as the video source
      setStream(mediaStream);
      
      if (videoRef.current) {
        // Make sure video element is ready
        videoRef.current.srcObject = null;
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready before notifying
        videoRef.current.onloadedmetadata = () => {
          console.log("Camera ready with resolution:", 
            videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
            
          // Reset retry counter on success
          setRetryCount(0);
            
          // Make sure video plays
          videoRef.current?.play()
            .then(() => {
              console.log("Video playback started successfully");
              onCameraStart?.();
            })
            .catch(playError => {
              console.error("Error starting video playback:", playError);
              setCameraError("Failed to start video playback. Please reload the page or check browser permissions.");
              setIsCapturing(false);
              
              // Auto-retry playback
              setTimeout(() => {
                console.log("Auto-retrying video playback...");
                videoRef.current?.play()
                  .catch(e => console.error("Retry failed:", e));
              }, 1000);
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
      
      // Auto-retry logic with backoff
      if (retryCount < maxRetries) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        const delay = 1000 * newRetryCount; // Increasing delay for each retry
        console.log(`Retrying camera initialization in ${delay/1000} seconds (attempt ${newRetryCount} of ${maxRetries})...`);
        
        setTimeout(() => {
          console.log("Auto-retrying camera initialization...");
          startCamera(videoConstraints);
        }, delay);
      }
    }
  }, [setCameraError, setIsCapturing, onCameraStart, setStream, stream, videoRef, initialized, setInitialized, retryCount, setRetryCount]);

  return { startCamera };
}
