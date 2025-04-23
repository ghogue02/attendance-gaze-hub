
// Recognition types
export interface FaceDetectionOptions {
  preview?: boolean;
  debugAttempt?: number;
}

export interface RecognitionHistoryManager {
  recognitionHistory: Map<string, number>;
  currentTime: number;
}
