
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
      // Always pass the message to onError in passive mode for "No face detected"
      // This allows AttendanceCamera to track consecutive failures
      if (isPassive && result.message === 'No face detected in frame') {
        onError?.(result.message);
      } else if (!isPassive) {
        // For other errors in active mode, show the error
        onError?.(result.message);
      } else {
        // For other passive mode errors, just log
        console.log("Passive recognition result:", result.message);
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

