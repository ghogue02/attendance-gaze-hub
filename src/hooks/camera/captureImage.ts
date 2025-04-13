
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
    
    // Clear the canvas first to ensure no previous data remains
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the video frame to the canvas - try with error handling
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch (drawError) {
      console.error('Error drawing video to canvas:', drawError);
      return null;
    }
    
    // Convert canvas to data URL (base64 image) with moderate quality to reduce size
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.85);
      
      // Verify the data URL is valid
      if (!imageData || imageData === 'data:,') {
        console.error('Generated image data is invalid');
        return null;
      }
      
      console.log(`Successfully captured image: ${Math.round(imageData.length / 1024)}KB`);
      return imageData;
    } catch (dataUrlError) {
      console.error('Error converting canvas to data URL:', dataUrlError);
      return null;
    }
  } catch (error) {
    console.error('Error capturing image from video:', error);
    return null;
  }
};

/**
 * Compresses an image to a target size while maintaining quality
 * @param dataUrl The original image data URL
 * @param maxSizeKB The maximum size in KB
 * @param quality Initial quality to try (0.0-1.0)
 * @returns A compressed image data URL
 */
export const compressImage = async (
  dataUrl: string, 
  maxSizeKB: number = 1500,
  quality: number = 0.9
): Promise<string> => {
  if (!dataUrl?.startsWith('data:image/')) {
    console.error('Invalid image data provided to compression function');
    return dataUrl; // Return original if invalid
  }
  
  // If the image is already small enough, return it
  const initialSizeKB = Math.round(dataUrl.length / 1024);
  if (initialSizeKB <= maxSizeKB) {
    console.log(`Image already under ${maxSizeKB}KB (${initialSizeKB}KB), skipping compression`);
    return dataUrl;
  }
  
  console.log(`Compressing image from ${initialSizeKB}KB to target size ${maxSizeKB}KB`);
  
  // Create an image to draw from the data URL
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context for compression');
        resolve(dataUrl);
        return;
      }
      
      // Calculate dimensions
      let width = img.width;
      let height = img.height;
      
      // Scale down if needed for large images
      const MAX_WIDTH = 1280;
      const MAX_HEIGHT = 720;
      
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
        console.log(`Resizing image to ${width}x${height}`);
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw image onto canvas
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try progressive compression if needed
      const tryCompress = (q: number): string => {
        const compressed = canvas.toDataURL('image/jpeg', q);
        const sizeKB = Math.round(compressed.length / 1024);
        
        console.log(`Compression trial with quality ${q}: ${sizeKB}KB`);
        
        if (sizeKB <= maxSizeKB || q <= 0.2) {
          // Success or reached minimum quality
          return compressed;
        } else {
          // Estimate new quality based on size ratio
          const newQuality = q * 0.8 * (maxSizeKB / sizeKB);
          return tryCompress(Math.max(0.2, Math.min(0.9, newQuality))); // Limit between 0.2 and 0.9
        }
      };
      
      // Start compression
      const result = tryCompress(quality);
      resolve(result);
    };
    
    img.onerror = () => {
      console.error('Image failed to load for compression');
      resolve(dataUrl); // Return original on error
    };
    
    img.src = dataUrl;
  });
};
