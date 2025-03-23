
// Import existing functionalities
import { detectFaces, checkRecentlyRecognized, fetchRegisteredStudents, groupRegistrationsByStudent, fetchStudentDetails, recordAttendance, updateRecognitionHistory, manageRecognitionHistory } from './recognitionUtils';
import { getRecognitionSettings } from './setup';
import { recognizeFace as recognizeFaceWithFacenet } from './facenetIntegration';
import { recognizeFaceBasic } from './fallbackRecognition';
import { Builder } from '@/components/BuilderCard';
import { markAttendance } from './attendance';

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
  // Use a higher confidence threshold to improve accuracy
  const confidenceThreshold = Math.max(settings.minConfidenceThreshold, 0.9); // Increased threshold
  
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
      // Try FaceNet first for better accuracy
      if (debugMode) console.log('Attempting FaceNet recognition for better accuracy...');
      
      // Check if the current user is authenticated first
      const { data: userProfile } = await supabase.auth.getUser();
      const isAuthenticated = !!userProfile?.user?.id;
      
      let facenetResult = { success: false, message: 'FaceNet not attempted' };
      
      // Only try FaceNet if not in passive mode (it's slower)
      if (!isPassive) {
        try {
          facenetResult = await Promise.race([
            recognizeFaceWithFacenet(imageData, confidenceThreshold),
            timeoutPromise
          ]) as { success: boolean; builder?: Builder; message: string };
        } catch (facenetError) {
          console.error('FaceNet recognition error:', facenetError);
          facenetResult = { 
            success: false, 
            message: facenetError instanceof Error 
              ? facenetError.message 
              : 'FaceNet recognition failed' 
          };
        }
      }
      
      if (facenetResult.success && facenetResult.builder) {
        // Success with FaceNet
        if (debugMode) console.log('FaceNet recognition successful', facenetResult.builder);
        
        // Record this successful recognition
        const { recognitionHistory, currentTime } = manageRecognitionHistory();
        updateRecognitionHistory(facenetResult.builder.id, recognitionHistory, currentTime);
        
        // Record attendance using both methods with proper timestamp format
        const now = new Date();
        const isoTimestamp = now.toISOString();
        
        const attendanceResult1 = await recordAttendance(facenetResult.builder.id, "present", isoTimestamp);
        const attendanceResult2 = await markAttendance(facenetResult.builder.id, "present");
        
        if (debugMode) {
          console.log('Attendance recording results:', { 
            recordAttendance: attendanceResult1,
            markAttendance: attendanceResult2
          });
        }
        
        // Notify of success
        onSuccess?.(facenetResult.builder);
        onComplete?.();
        return;
      }
      
      // If FaceNet failed, try the improved basic approach
      if (debugMode) console.log('FaceNet found no match, trying improved basic recognition');
      
      const basicResult = await Promise.race([
        recognizeFaceBasic(imageData, confidenceThreshold),
        timeoutPromise
      ]) as { success: boolean; builder?: Builder; message: string };
      
      if (basicResult.success && basicResult.builder) {
        // Success with basic recognition
        if (debugMode) console.log('Basic recognition successful', basicResult.builder);
        
        // Record this successful recognition
        const { recognitionHistory, currentTime } = manageRecognitionHistory();
        updateRecognitionHistory(basicResult.builder.id, recognitionHistory, currentTime);
        
        // Record attendance using both methods with proper timestamp format
        const now = new Date();
        const isoTimestamp = now.toISOString();
        
        const attendanceResult1 = await recordAttendance(basicResult.builder.id, "present", isoTimestamp);
        const attendanceResult2 = await markAttendance(basicResult.builder.id, "present");
        
        if (debugMode) {
          console.log('Attendance recording results:', { 
            recordAttendance: attendanceResult1,
            markAttendance: attendanceResult2
          });
        }
        
        // Notify of success
        onSuccess?.(basicResult.builder);
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

// Import supabase client for user authentication
import { supabase } from '@/integrations/supabase/client';
