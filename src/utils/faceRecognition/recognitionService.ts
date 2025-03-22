
import { recognizeFace } from './recognition';
import { Builder } from '@/components/BuilderCard';

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
