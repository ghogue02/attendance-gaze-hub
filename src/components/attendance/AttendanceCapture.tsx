
import { useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import { useAttendanceCapture } from '@/hooks/attendance-capture';
import CameraViewport from './CameraViewport';
import CaptureButton from './CaptureButton';
import ProcessingOverlay from './ProcessingOverlay';

interface AttendanceCaptureProps {
  onAttendanceMarked: (builder: Builder) => void;
  isCameraActive: boolean;
  selectedBuilder?: Builder | null;
}

const AttendanceCapture = ({
  onAttendanceMarked,
  isCameraActive,
  selectedBuilder = null
}: AttendanceCaptureProps) => {
  
  useEffect(() => {
    console.log('AttendanceCapture mounted, selectedBuilder:', selectedBuilder?.id);
  }, [selectedBuilder]);
  
  const {
    videoRef,
    canvasRef,
    isCapturing,
    cameraError,
    processing,
    statusMessage,
    handleRetryCamera,
    handleCaptureAttendance
  } = useAttendanceCapture({
    onAttendanceMarked,
    isCameraActive,
    selectedBuilder
  });
  
  return (
    <div className="space-y-4">
      <CameraViewport 
        videoRef={videoRef}
        canvasRef={canvasRef}
        isCapturing={isCapturing}
        cameraError={cameraError}
        processing={processing}
        statusMessage={statusMessage}
        onRetry={handleRetryCamera}
      />
      
      {processing && <ProcessingOverlay show={processing} message={statusMessage || 'Processing...'} />}
      
      <div className="flex justify-center">
        <CaptureButton 
          onClick={handleCaptureAttendance}
          disabled={!isCapturing || processing}
          processing={processing}
        />
      </div>
    </div>
  );
};

export default AttendanceCapture;
