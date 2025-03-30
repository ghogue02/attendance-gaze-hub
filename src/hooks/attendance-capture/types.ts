
import { Builder } from '@/components/builder/types';

export interface UseAttendanceCaptureProps {
  onAttendanceMarked: (builder: Builder) => void;
  isCameraActive: boolean;
  selectedBuilder?: Builder | null;
}

export interface UseAttendanceCaptureReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  cameraError: string;
  processing: boolean;
  statusMessage: string | null;
  handleRetryCamera: () => void;
  handleCaptureAttendance: () => Promise<void>;
}
