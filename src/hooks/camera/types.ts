
export interface CameraConstraints {
  facingMode?: 'user' | 'environment';
  width?: { min?: number; ideal?: number; max?: number };
  height?: { min?: number; ideal?: number; max?: number };
  frameRate?: { min?: number; ideal?: number; max?: number };
  aspectRatio?: number;
}

export interface UseCameraProps {
  onCameraStart?: () => void;
  onCameraStop?: () => void;
  isCameraActive?: boolean;
  videoConstraints?: CameraConstraints;
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  cameraError: string;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImageData: () => string | null;
  checkCameraHealth: () => boolean;
}
