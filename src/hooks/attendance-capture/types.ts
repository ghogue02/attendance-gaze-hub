
import { Builder, BuilderStatus } from '@/components/builder/types';

export interface AttendanceData {
  builderId: string;
  status: BuilderStatus;
  excuseReason?: string;
  notes?: string;
  date: string;
}

export interface AttendanceNavigationState {
  activeTab?: string;
  highlightBuilderId?: string;
}

// Add the missing types that are referenced in useAttendanceCapture
export interface UseAttendanceCaptureProps {
  onAttendanceMarked: (builder: Builder) => void;
  isCameraActive: boolean;
  selectedBuilder?: Builder | null;
}

export interface UseAttendanceCaptureReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  cameraError: string | null;
  processing: boolean;
  statusMessage: string | null;
  handleRetryCamera: () => void;
  handleCaptureAttendance: () => Promise<void>;
}
