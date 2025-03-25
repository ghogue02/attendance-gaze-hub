
import { RefObject } from 'react';

export interface CameraConstraints {
  facingMode?: 'user' | 'environment';
  width?: number | { min: number; ideal: number; max: number };
  height?: number | { min: number; ideal: number; max: number };
  aspectRatio?: number;
  frameRate?: number | { min: number; ideal: number; max: number };
}

export interface UseCameraProps {
  isCameraActive?: boolean;
  videoConstraints?: CameraConstraints;
  onCameraStart?: () => void;
  onCameraStop?: () => void;
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
