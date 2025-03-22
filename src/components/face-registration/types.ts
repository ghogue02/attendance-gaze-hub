
import { Builder } from '@/components/BuilderCard';

export interface RegistrationCaptureProps {
  builder: Builder;
  onRegistrationUpdate: (completed: boolean, progress: number, currentAngle: number) => void;
}

export interface AutoCaptureProps {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
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
