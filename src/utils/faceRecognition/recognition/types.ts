
import { Builder, BuilderStatus } from '@/components/builder/types';

// Recognition types
export interface FaceDetectionOptions {
  preview?: boolean;
  debugAttempt?: number;
}

export interface RecognitionHistoryManager {
  recognitionHistory: Map<string, number>;
  currentTime: number;
}

export interface RecognitionResult {
  success: boolean;
  builder?: Builder;
  message: string;
}

export interface FaceDetectionResult {
  success: boolean;
  hasFaces: boolean;
  faceCount?: number;
  confidence?: number;
  message: string;
  debugAttempt?: number;
  faceVertices?: any;
}

// Re-export these types properly with 'export type'
export type { Builder, BuilderStatus };
