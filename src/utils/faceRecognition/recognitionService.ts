
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
  
  console.log(`Processing ${isPassive ? 'passive' : 'active'} face recognition`);
  
  try {
    const result = await recognizeFace(imageData, isPassive);
    console.log("Recognition result:", result);
    
    if (result.success && result.builder) {
      onSuccess?.(result.builder);
    } else if (!isPassive) {
      // Only show error messages in active mode
      onError?.(result.message);
    } else {
      // For passive mode, silently continue
      console.log("Passive recognition failed:", result.message);
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
