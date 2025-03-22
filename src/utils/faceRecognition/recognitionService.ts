
import { recognizeFace } from './recognition';
import { Builder } from '@/components/BuilderCard';
import { supabase } from '@/integrations/supabase/client';

interface RecognitionOptions {
  isPassive: boolean;
  onSuccess?: (builder: Builder) => void;
  onError?: (message: string) => void;
  onComplete?: () => void;
}

export const processRecognition = async (
  imageData: string,
  options: RecognitionOptions
) => {
  const { isPassive, onSuccess, onError, onComplete } = options;
  
  try {
    // First, check if there are actually faces in the image using Google Cloud Vision
    const faceDetectionResult = await detectFacesWithVision(imageData, isPassive);
    
    if (!faceDetectionResult.success) {
      // If there was an error with the Vision API, fall back to the simulated recognition
      console.warn('Vision API error, falling back to simulated recognition:', faceDetectionResult.message);
    } else if (!faceDetectionResult.hasFaces) {
      // If Vision API confirms there are no faces, don't proceed with recognition
      onError?.('No face detected in frame');
      onComplete?.();
      return;
    }
    
    // If we have faces or had an API error, proceed with recognition
    const result = await recognizeFace(imageData, isPassive);
    
    if (result.success && result.builder) {
      onSuccess?.(result.builder);
    } else {
      // In passive mode, ALWAYS pass the "No face detected" message to onError
      // This is critical for proper UI feedback and prevents false detections
      if (isPassive && result.message === 'No face detected in frame') {
        onError?.(result.message);
      } else if (!isPassive) {
        // For other errors in active mode, show the error
        onError?.(result.message);
      } else if (result.message !== 'Recently recognized') {
        // For other passive mode errors (except "Recently recognized"), log and notify
        console.log("Passive recognition result:", result.message);
        onError?.(result.message);
      }
    }
  } catch (error) {
    console.error('Face recognition error:', error);
    
    if (!isPassive) {
      onError?.('An error occurred during face recognition');
    }
  } finally {
    onComplete?.();
  }
};

// Function to detect faces using Google Cloud Vision API
async function detectFacesWithVision(imageData: string, isPassive: boolean) {
  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('detect-faces', {
      body: { imageData, isPassive }
    });
    
    if (error) {
      console.error('Error calling face detection function:', error);
      return { 
        success: false, 
        message: 'Error calling face detection service',
        hasFaces: false 
      };
    }
    
    // Process the response
    return { 
      success: true,
      hasFaces: data.hasFaces,
      faceCount: data.faceCount,
      confidence: data.confidence,
      message: data.hasFaces ? `Detected ${data.faceCount} faces` : 'No face detected in frame'
    };
  } catch (error) {
    console.error('Face detection error:', error);
    return { 
      success: false, 
      message: 'Face detection service error',
      hasFaces: false 
    };
  }
}
