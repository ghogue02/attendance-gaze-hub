
import { Builder, BuilderStatus } from '@/components/builder/types';

export interface AttendanceCaptureState {
  loading: boolean;
  processing: boolean;
  error: string | null;
  recognizedBuilder: Builder | null;
  showPreview: boolean;
  previewUrl: string | null;
  recognitionConfidence: number;
  captureMode: 'standard' | 'fallback';
}

export interface UseAttendanceCaptureProps {
  onSuccess?: (builder: Builder) => void;
  onError?: (error: string) => void;
}

export interface UseAttendanceCaptureReturn {
  state: AttendanceCaptureState;
  capturePhoto: () => Promise<void>;
  retake: () => void;
  markAttendance: (status: BuilderStatus, reason?: string) => Promise<void>;
  cancelRecognition: () => void;
}

export interface AttendanceNavigationState {
  activeTab?: string;
  highlightBuilderId?: string;
}
