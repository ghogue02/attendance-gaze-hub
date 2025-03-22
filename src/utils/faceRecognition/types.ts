
import { Builder, BuilderStatus } from '@/components/BuilderCard';

export interface RecognitionResult {
  success: boolean;
  builder?: Builder;
  message: string;
}

export interface FaceRegistrationResult {
  success: boolean;
  message: string;
  imageCount?: number;
  completed?: boolean;
  nextAngleIndex?: number;
}

export interface RecognitionOptions {
  isPassive: boolean;
  debugMode?: boolean;
  onSuccess: (builder: Builder) => void;
  onError: (message: string) => void;
  onComplete: () => void;
}
