
import { Builder } from '@/components/builder/types';
import { simplifiedRecognize, recordAttendance } from './simplifiedRecognition';

// Options for the recognition process
interface RecognitionOptions {
  isPassive?: boolean;
  debugMode?: boolean;
  onSuccess?: (builder: Builder) => void;
  onError?: (message: string) => void;
  onComplete?: () => void;
  timeout?: number;
}

// Keep track of recognized builders to avoid duplicates
const recentlyRecognized = new Map<string, number>();
const RECOGNITION_COOLDOWN = 10000; // 10 seconds

/**
 * A simplified recognition service that focuses on reliability
 * rather than complex face detection. This makes the app more
 * usable in environments where face detection is challenging.
 */
export const processSimplifiedRecognition = async (
  imageData: string,
  options: RecognitionOptions = {}
) => {
  const { 
    isPassive = false, 
    debugMode = false,
    onSuccess, 
    onError,
    onComplete,
    timeout = 5000
  } = options;
  
  if (debugMode) console.log('Starting simplified recognition process');
  
  try {
    // Simulate processing time
    const processStart = Date.now();
    
    // First check if image is valid
    if (!imageData || !imageData.startsWith('data:image/')) {
      onError?.('Invalid image data');
      onComplete?.();
      return;
    }
    
    // Run simplified recognition
    const result = await simplifiedRecognize(imageData);
    
    if (result.success && result.builder) {
      const builderId = result.builder.id;
      
      // Check if this builder was recently recognized
      const lastRecognized = recentlyRecognized.get(builderId);
      const currentTime = Date.now();
      
      if (lastRecognized && currentTime - lastRecognized < RECOGNITION_COOLDOWN) {
        if (debugMode) console.log(`Builder ${builderId} was recently recognized`);
        onError?.('Recently recognized');
        onComplete?.();
        return;
      }
      
      // Add a minimum process time to make the UX feel more natural
      const processTime = Date.now() - processStart;
      if (processTime < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - processTime));
      }
      
      // Update recognition time and record attendance
      recentlyRecognized.set(builderId, currentTime);
      
      // Record attendance in the database
      await recordAttendance(builderId);
      
      // Notify of successful recognition
      onSuccess?.(result.builder);
    } else {
      onError?.(result.message || 'No matching face found');
    }
  } catch (error) {
    console.error('Error in recognition process:', error);
    onError?.('An error occurred during recognition');
  } finally {
    onComplete?.();
  }
};

/**
 * Periodically clean up the recognition history
 */
setInterval(() => {
  const currentTime = Date.now();
  const expiryTime = currentTime - RECOGNITION_COOLDOWN;
  
  recentlyRecognized.forEach((timestamp, id) => {
    if (timestamp < expiryTime) {
      recentlyRecognized.delete(id);
    }
  });
}, 60000); // Clean up every minute
