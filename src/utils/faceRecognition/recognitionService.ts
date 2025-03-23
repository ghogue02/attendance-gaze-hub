
// Import existing functionalities
import { detectFaces, checkRecentlyRecognized, fetchRegisteredStudents, groupRegistrationsByStudent, fetchStudentDetails, recordAttendance, updateRecognitionHistory, manageRecognitionHistory } from './recognitionUtils';
import { getRecognitionSettings } from './setup';
import { recognizeFace as recognizeFaceWithFacenet } from './facenetIntegration';
import { recognizeFaceBasic } from './fallbackRecognition';
import { Builder } from '@/components/BuilderCard';

// Options for the recognition process
interface RecognitionOptions {
  isPassive?: boolean;
  debugMode?: boolean;
  onSuccess?: (builder: Builder) => void;
  onError?: (message: string) => void;
  onComplete?: () => void;
  timeout?: number; // Added timeout option
}

/**
 * Process an image for face recognition
 * This is the main function used for recognizing faces,
 * with a fallback to simpler methods if facenet fails
 */
export const processRecognition = async (
  imageData: string,
  options: RecognitionOptions = {}
) => {
  const { 
    isPassive = false, 
    debugMode = false,
    onSuccess, 
    onError,
    onComplete,
    timeout = 10000 // Default timeout of 10 seconds
  } = options;
  
  const settings = getRecognitionSettings();
  
  // Add timeout to prevent getting stuck
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Face recognition timed out')), timeout);
  });
  
  try {
    // First check if we've recently recognized this person
    if (isPassive) {
      const { recognitionHistory, currentTime } = manageRecognitionHistory();
      const recentlyRecognized = await checkRecentlyRecognized("all", recognitionHistory, currentTime);
      
      if (recentlyRecognized) {
        if (debugMode) console.log('Recently recognized, skipping');
        onError?.('Recently recognized');
        onComplete?.();
        return;
      }
    }
    
    // Use Promise.race to implement timeout
    try {
      // Try the basic approach first (more reliable but less accurate)
      if (debugMode) console.log('Attempting basic recognition first for reliability...');
      
      const basicResult = await Promise.race([
        recognizeFaceBasic(imageData, settings.minConfidenceThreshold),
        timeoutPromise
      ]) as { success: boolean; builder?: Builder; message: string };
      
      if (basicResult.success && basicResult.builder) {
        // Success with basic recognition
        if (debugMode) console.log('Basic recognition successful');
        
        // Record this successful recognition
        const { recognitionHistory, currentTime } = manageRecognitionHistory();
        updateRecognitionHistory(basicResult.builder.id, recognitionHistory, currentTime);
        await recordAttendance(basicResult.builder.id, "present");
        
        // Notify of success
        onSuccess?.(basicResult.builder);
        onComplete?.();
        return;
      }
      
      // If basic failed, try FaceNet
      if (debugMode) console.log('Basic recognition found no match, trying FaceNet');
      
      const facenetResult = await Promise.race([
        recognizeFaceWithFacenet(imageData, settings.minConfidenceThreshold),
        timeoutPromise
      ]) as { success: boolean; builder?: Builder; message: string };
      
      if (facenetResult.success && facenetResult.builder) {
        // Success with FaceNet
        if (debugMode) console.log('FaceNet recognition successful');
        
        // Record this successful recognition
        const { recognitionHistory, currentTime } = manageRecognitionHistory();
        updateRecognitionHistory(facenetResult.builder.id, recognitionHistory, currentTime);
        await recordAttendance(facenetResult.builder.id, "present");
        
        // Notify of success
        onSuccess?.(facenetResult.builder);
        onComplete?.();
        return;
      }
      
      // No method found a match
      if (debugMode) console.log('No match found with either method');
      onError?.(facenetResult.message || basicResult.message || 'No matching face found');
      onComplete?.();
      
    } catch (innerError) {
      // Check if this is a timeout error
      if (innerError instanceof Error && innerError.message === 'Face recognition timed out') {
        console.error('Face recognition timed out after', timeout, 'ms');
        onError?.('Recognition took too long. Please try again.');
      } else {
        console.error('Error in recognition process:', innerError);
        onError?.('An error occurred during recognition');
      }
      onComplete?.();
    }
    
  } catch (error) {
    console.error('Error in recognition process:', error);
    onError?.('An error occurred during recognition');
    onComplete?.();
  }
};
