
// Import existing functionalities
import { detectFaces, checkRecentlyRecognized, fetchRegisteredStudents, groupRegistrationsByStudent, fetchStudentDetails, recordAttendance, updateRecognitionHistory, manageRecognitionHistory } from './recognitionUtils';
import { getRecognitionSettings } from './setup';
import { recognizeFace } from './facenetIntegration';
import { recognizeFaceBasic } from './fallbackRecognition';
import { Builder } from '@/components/BuilderCard';

// Options for the recognition process
interface RecognitionOptions {
  isPassive?: boolean;
  debugMode?: boolean;
  onSuccess?: (builder: Builder) => void;
  onError?: (message: string) => void;
  onComplete?: () => void;
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
    onComplete 
  } = options;
  
  const settings = getRecognitionSettings();
  
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
    
    // Try the enhanced FaceNet approach first
    try {
      if (debugMode) console.log('Attempting FaceNet recognition...');
      
      const result = await recognizeFace(imageData, settings.minConfidenceThreshold);
      
      if (result.success && result.builder) {
        // Success! We found a match with FaceNet
        if (debugMode) console.log('FaceNet recognition successful');
        
        // Record this successful recognition
        const { recognitionHistory, currentTime } = manageRecognitionHistory();
        updateRecognitionHistory(result.builder.id, recognitionHistory, currentTime);
        await recordAttendance(result.builder.id, "present");
        
        // Notify of success
        onSuccess?.(result.builder);
        onComplete?.();
        return;
      } else {
        // FaceNet didn't find a match, but didn't error
        if (debugMode) console.log('FaceNet found no match, trying fallback', result.message);
      }
    } catch (error) {
      // FaceNet had an error, try fallback
      if (debugMode) console.error('FaceNet recognition error, trying fallback:', error);
    }
    
    // Fallback to basic recognition
    if (debugMode) console.log('Using fallback recognition...');
    
    const fallbackResult = await recognizeFaceBasic(imageData, settings.minConfidenceThreshold);
    
    if (fallbackResult.success && fallbackResult.builder) {
      // Fallback succeeded
      if (debugMode) console.log('Fallback recognition successful');
      
      // Record this successful recognition
      const { recognitionHistory, currentTime } = manageRecognitionHistory();
      updateRecognitionHistory(fallbackResult.builder.id, recognitionHistory, currentTime);
      await recordAttendance(fallbackResult.builder.id, "present");
      
      // Notify of success
      onSuccess?.(fallbackResult.builder);
      onComplete?.();
      return;
    }
    
    // If we get here, neither method found a match
    if (debugMode) console.log('No match found with either method');
    onError?.(fallbackResult.message || 'No matching face found');
    onComplete?.();
    
  } catch (error) {
    console.error('Error in recognition process:', error);
    onError?.('An error occurred during recognition');
    onComplete?.();
  }
};
