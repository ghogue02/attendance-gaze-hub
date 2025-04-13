
import { useCallback } from 'react';
import { stopMediaStreamTracks, getCameraErrorMessage, mergeConstraints } from './utils';
import type { CameraConstraints } from './types';

export function useCameraStart({
  videoRef,
  streamRef,
  retryCountRef,
  initializedRef,
  setIsCapturing,
  setCameraError,
  onCameraStart
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  streamRef: React.RefObject<MediaStream | null>;
  retryCountRef: React.RefObject<number>;
  initializedRef: React.RefObject<boolean>;
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
      if (streamRef.current) {
        stopMediaStreamTracks(streamRef.current);
        streamRef.current = null;
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
      if (initializedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        initializedRef.current = true;
      }
      
      // Try to get access to the camera
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log("Camera access granted successfully");
      
      // Store the stream and set it as the video source
      streamRef.current = stream;
      
      if (videoRef.current) {
        // Make sure video element is ready
        videoRef.current.srcObject = null;
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready before notifying
        videoRef.current.onloadedmetadata = () => {
          console.log("Camera ready with resolution:", 
            videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
            
          // Reset retry counter on success
          retryCountRef.current = 0;
            
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
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = 1000 * retryCountRef.current; // Increasing delay for each retry
        console.log(`Retrying camera initialization in ${delay/1000} seconds (attempt ${retryCountRef.current} of ${maxRetries})...`);
        
        setTimeout(() => {
          console.log("Auto-retrying camera initialization...");
          startCamera(videoConstraints);
        }, delay);
      }
    }
  }, [setCameraError, setIsCapturing, onCameraStart]);

  return { startCamera };
}
