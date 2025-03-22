
import { Builder } from '@/components/BuilderCard';

export interface RegistrationCaptureProps {
  builder: Builder;
  onRegistrationUpdate: (completed: boolean, progress: number, currentAngle: number) => void;
  isUpdateMode?: boolean;
}

export interface AutoCaptureProps {
  isActive: boolean;
  onToggle: () => void;
}

export interface CaptureControlsProps {
  autoCapture: boolean;
  onToggleAutoCapture: () => void;
  onManualCapture: () => void;
  isCapturing: boolean;
  processing: boolean;
  currentAngle: number;
}
