
import { RefObject } from 'react';

export interface CameraConstraints {
  facingMode?: 'user' | 'environment';
  width?: { min?: number; ideal?: number; max?: number };
  height?: { min?: number; ideal?: number; max?: number };
  aspectRatio?: number;
  frameRate?: { min?: number; ideal?: number; max?: number };
}

export interface UseCameraProps {
  onCameraStart?: () => void;
  onCameraStop?: () => void;
  isCameraActive?: boolean;
  videoConstraints?: CameraConstraints;
  canvasRef?: RefObject<HTMLCanvasElement>;
}

export interface UseCameraReturn {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  cameraError: string;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImageData: () => string | null;
  checkCameraHealth: () => boolean;
}
