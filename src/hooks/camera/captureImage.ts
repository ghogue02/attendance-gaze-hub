
import { RefObject } from 'react';

/**
 * Captures an image from a video element and returns it as a base64 string
 */
export const captureImageFromVideo = (
  videoRef: RefObject<HTMLVideoElement>,
  canvasRef: RefObject<HTMLCanvasElement>
): string | null => {
  try {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) {
      console.error('Video or canvas reference not available', { 
        videoExists: !!video, 
        canvasExists: !!canvas 
      });
      return null;
    }
    
    const { videoWidth, videoHeight } = video;
    
    if (videoWidth === 0 || videoHeight === 0) {
      console.error('Video dimensions are not available', { videoWidth, videoHeight });
      return null;
    }
    
    // Set canvas dimensions to match video
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return null;
    }
    
    // Draw the video frame to the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL (base64 image)
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    return imageData;
  } catch (error) {
    console.error('Error capturing image from video:', error);
    return null;
  }
};
