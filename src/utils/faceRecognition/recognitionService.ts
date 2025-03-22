
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
    } else if (!isPassive) {
      // Only show error messages in active mode
      onError?.(result.message);
    } else {
      // For passive mode, silently continue
      onError?.(result.message);
      console.log("Passive recognition result:", result.message);
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
