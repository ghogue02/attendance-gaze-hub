
/**
 * Captures the current frame from a video element and returns it as a data URL
 */
export function captureImageFromVideo(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>
): string | null {
  if (!videoRef.current || !canvasRef.current) {
    console.error('Video or canvas reference not available');
    return null;
  }
  
  const video = videoRef.current;
  const canvas = canvasRef.current;
  
  // Ensure video is playing and has dimensions
  if (video.paused || video.ended || !video.videoWidth) {
    console.error('Video is not playing or has no dimensions');
    return null;
  }
  
  const context = canvas.getContext('2d');
  
  if (!context) {
    console.error('Canvas context not available');
    return null;
  }
  
  // Set canvas to match video dimensions
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  if (canvas.width === 0 || canvas.height === 0) {
    console.error('Invalid video dimensions:', canvas.width, 'x', canvas.height);
    return null;
  }
  
  // Check if video is playing and ready
  if (video.readyState !== 4) {
    console.error('Video is not ready for capture, readyState:', video.readyState);
    return null;
  }
  
  try {
    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // For optimal performance, use a lower quality JPEG
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (err) {
    console.error('Error converting canvas to data URL:', err);
    return null;
  }
}
