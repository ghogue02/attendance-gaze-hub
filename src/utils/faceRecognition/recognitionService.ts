
// Import existing functionalities
import { detectFaces, checkRecentlyRecognized, fetchRegisteredStudents, groupRegistrationsByStudent, fetchStudentDetails, recordAttendance, updateRecognitionHistory, manageRecognitionHistory } from './recognitionUtils';
import { getRecognitionSettings } from './setup';
import { recognizeFace as recognizeFaceWithFacenet } from './facenetIntegration';
import { Builder } from '@/components/BuilderCard';
import { markAttendance } from './attendance';
import { RecognitionResult } from './types';

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
 * with appropriate error handling for production use
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
  // Use a higher confidence threshold to improve accuracy
  const confidenceThreshold = Math.max(settings.minConfidenceThreshold, 0.7);
  
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
      if (debugMode) console.log('Attempting face recognition...');
      
      // First, try to detect face using browser's local model (more reliable approach)
      // Import the detectFaces function from browser-facenet directly for a direct check
      const { detectFaces: detectFacesLocally } = await import('./browser-facenet');
      const localFaceDetection = await detectFacesLocally(imageData);
      
      // If local detection works, log that we're using it
      let faceDetectedLocally = false;
      if (localFaceDetection && localFaceDetection.length > 0) {
        console.log('Face detected locally with browser model:', localFaceDetection.length, 'faces');
        faceDetectedLocally = true;
      } else {
        console.log('No faces detected locally, will try server detection');
      }
      
      // Try server-side detection as a second option if needed
      let serverDetectionResult = null;
      if (!faceDetectedLocally) {
        try {
          serverDetectionResult = await detectFaces(imageData, false, 0);
          if (debugMode) {
            console.log('Server detection result:', serverDetectionResult);
          }
        } catch (serverError) {
          console.error('Server face detection failed, using local detection only:', serverError);
        }
      }
      
      // Combine results - use local detection as priority, fallback to server
      const faceDetected = faceDetectedLocally || 
        (serverDetectionResult && serverDetectionResult.hasFaces);
      
      if (!faceDetected) {
        console.log('No face detected in the image by any method');
        onError?.('No face detected in frame');
        onComplete?.();
        return;
      }
      
      // Log detected faces
      console.log('Face detected in the image, proceeding with recognition');
      
      // Attempt to recognize with FaceNet
      const facenetResult: RecognitionResult = await Promise.race([
        recognizeFaceWithFacenet(imageData, confidenceThreshold),
        timeoutPromise
      ]) as RecognitionResult;
      
      if (facenetResult.success && facenetResult.builder) {
        // Success with recognition
        if (debugMode) console.log('Face recognition successful', facenetResult.builder);
        
        // Record this successful recognition
        const { recognitionHistory, currentTime } = manageRecognitionHistory();
        updateRecognitionHistory(facenetResult.builder.id, recognitionHistory, currentTime);
        
        // Record attendance with proper timestamp format
        const now = new Date();
        const isoTimestamp = now.toISOString();
        
        const attendanceResult = await recordAttendance(facenetResult.builder.id, "present", isoTimestamp);
        
        if (debugMode) {
          console.log('Attendance recording results:', attendanceResult);
        }
        
        // Notify of success
        onSuccess?.(facenetResult.builder);
        onComplete?.();
        return;
      }
      
      // No match found
      if (debugMode) console.log('No match found');
      onError?.(facenetResult.message || 'No matching face found');
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

// Import supabase client for user authentication
import { supabase } from '@/integrations/supabase/client';
