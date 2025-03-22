
import { recognizeFace } from './recognition';
import { Builder } from '@/components/BuilderCard';
import { supabase } from '@/integrations/supabase/client';

interface RecognitionOptions {
  isPassive: boolean;
  onSuccess?: (builder: Builder) => void;
  onError?: (message: string) => void;
  onComplete?: () => void;
  debugMode?: boolean;
}

export const processRecognition = async (
  imageData: string,
  options: RecognitionOptions
) => {
  const { isPassive, onSuccess, onError, onComplete, debugMode } = options;
  
  try {
    // First, check if there are actually faces in the image using Google Cloud Vision
    console.log('Sending image to Vision API for face detection...');
    const faceDetectionResult = await detectFacesWithVision(imageData, isPassive);
    
    if (debugMode) {
      console.log('Vision API result:', faceDetectionResult);
    }
    
    if (!faceDetectionResult.success) {
      // If there was an error with the Vision API, fall back to the simulated recognition
      console.warn('Vision API error, falling back to simulated recognition:', faceDetectionResult.message);
      
      // Proceed with recognition anyway - our fallback will handle cases where Vision fails
      const result = await recognizeFace(imageData, isPassive);
      
      if (result.success && result.builder) {
        onSuccess?.(result.builder);
      } else if (!isPassive) {
        // Only show errors in active mode when using fallback
        onError?.(result.message);
      }
      
      onComplete?.();
      return;
    }
    
    // Vision API was successful, now check if it detected faces
    if (faceDetectionResult.hasFaces) {
      console.log(`Vision API confirms ${faceDetectionResult.faceCount} face(s) detected with confidence ${faceDetectionResult.confidence}`);
      
      // If faces were detected, proceed with recognition
      const result = await recognizeFace(imageData, isPassive);
      
      if (result.success && result.builder) {
        onSuccess?.(result.builder);
      } else if (!isPassive) {
        // In active mode, always show errors
        onError?.(result.message || 'Recognition failed');
      } else if (result.message && result.message !== 'Recently recognized') {
        // In passive mode, show errors except "Recently recognized"
        console.log("Recognition result:", result.message);
        onError?.(result.message);
      }
    } else {
      // Vision API confirms no faces in the image
      console.log('Vision API confirms no faces in the frame');
      onError?.('No face detected in frame');
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
    console.log('Calling detect-faces edge function...');
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('detect-faces', {
      body: { 
        imageData, 
        isPassive,
        timestamp: new Date().toISOString() // Add timestamp to help debug
      }
    });
    
    if (error) {
      console.error('Error calling face detection function:', error);
      return { 
        success: false, 
        message: 'Error calling face detection service',
        hasFaces: false 
      };
    }
    
    if (!data.success) {
      console.error('Face detection was not successful:', data.error || 'Unknown error');
      return {
        success: false,
        message: data.error || 'Face detection failed',
        hasFaces: false
      };
    }
    
    // Process the response
    return { 
      success: true,
      hasFaces: data.hasFaces,
      faceCount: data.faceCount,
      confidence: data.confidence,
      message: data.message || (data.hasFaces ? `Detected ${data.faceCount} faces` : 'No face detected in frame')
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
