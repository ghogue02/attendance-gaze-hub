
import { Builder, BuilderStatus } from '@/components/builder/types';
import { RefObject } from 'react';

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
  onAttendanceMarked: (builder: Builder) => void;
  isCameraActive: boolean;
  selectedBuilder?: Builder | null;
  onError?: (error: string) => void;
}

export interface UseAttendanceCaptureReturn {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  cameraError: string;
  processing: boolean;
  statusMessage: string | null;
  handleRetryCamera: () => void;
  handleCaptureAttendance: () => Promise<void>;
  state?: AttendanceCaptureState;
  capturePhoto?: () => Promise<void>;
  retake?: () => void;
  markAttendance?: (status: BuilderStatus, reason?: string) => Promise<void>;
  cancelRecognition?: () => void;
}

export interface AttendanceNavigationState {
  activeTab?: string;
  highlightBuilderId?: string;
}
