
import { useRef } from 'react';
import { Builder } from '@/components/builder/types';
import { useCamera } from '@/hooks/camera/useCamera';
import CapturePhoto from './attendance/CapturePhoto';
import CameraDisplay from './attendance/CameraDisplay';
import ErrorDisplay from './attendance/ErrorDisplay';
import { useSimpleAttendanceCapture } from '@/hooks/useSimpleAttendanceCapture';

interface SimpleAttendanceCameraProps {
  onAttendanceMarked: (builder: Builder) => void;
  isCameraActive: boolean;
  selectedBuilder?: Builder | null;
}

const SimpleAttendanceCamera = ({
  onAttendanceMarked,
  isCameraActive,
  selectedBuilder = null
}: SimpleAttendanceCameraProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const {
    videoRef,
    isCapturing,
    cameraError,
    startCamera,
    stopCamera,
    captureImageData
  } = useCamera({
    isCameraActive,
    canvasRef,
    videoConstraints: {
      facingMode: 'user',
      width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 720, max: 1080 }
    }
  });

  const {
    error,
    processing,
    handleCaptureAttendance,
    setError
  } = useSimpleAttendanceCapture({
    onAttendanceMarked,
    selectedBuilder,
    captureImageData,
    isCapturing
  });

  const handleRestartCamera = () => {
    setError(null);
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <CameraDisplay 
        videoRef={videoRef} 
        canvasRef={canvasRef}
        isCapturing={isCapturing}
        cameraError={cameraError}
        onRestartCamera={handleRestartCamera}
        processingStatus={processing ? "Processing..." : null}
      />
      
      <ErrorDisplay error={error} />
      
      <CapturePhoto
        isCapturing={isCapturing}
        selectedBuilder={selectedBuilder}
        onCapture={handleCaptureAttendance}
        error={error}
        processing={processing}
      />
    </div>
  );
};

export default SimpleAttendanceCamera;
