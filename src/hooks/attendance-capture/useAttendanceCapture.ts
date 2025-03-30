
import { useCamera } from '@/hooks/camera';
import { useAttendanceProcessor } from './useAttendanceProcessor';
import { UseAttendanceCaptureProps, UseAttendanceCaptureReturn } from './types';

export const useAttendanceCapture = ({
  onAttendanceMarked,
  isCameraActive,
  selectedBuilder
}: UseAttendanceCaptureProps): UseAttendanceCaptureReturn => {
  const {
    processing,
    statusMessage,
    setProcessing,
    setStatusMessage,
    processSelectedBuilder,
    processManualBuilder
  } = useAttendanceProcessor({ onAttendanceMarked });
  
  const {
    videoRef,
    canvasRef,
    isCapturing,
    cameraError,
    startCamera,
    stopCamera,
    captureImageData
  } = useCamera({
    isCameraActive,
    videoConstraints: {
      facingMode: 'user',
      width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 720, max: 1080 }
    },
    onCameraStart: () => {
      setStatusMessage('Camera ready. Center yourself in the frame.');
    }
  });
  
  const handleRetryCamera = () => {
    setStatusMessage('Restarting camera...');
    stopCamera();
    
    setTimeout(() => {
      startCamera();
    }, 1000);
  };
  
  const handleCaptureAttendance = async () => {
    if (!isCapturing || processing) return;
    
    setProcessing(true);
    setStatusMessage('Processing your image...');
    
    try {
      // Capture image
      const imageData = captureImageData();
      
      let success = false;
      
      if (selectedBuilder) {
        // Process with pre-selected builder
        success = await processSelectedBuilder(selectedBuilder, imageData);
      } else {
        // Process with manual builder ID entry
        success = await processManualBuilder(imageData);
      }
      
      if (!success) {
        setStatusMessage('Failed to process attendance. Please try again.');
      }
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Error marking attendance. Please try again.');
      setStatusMessage('An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return {
    videoRef,
    canvasRef,
    isCapturing,
    cameraError,
    processing,
    statusMessage,
    handleRetryCamera,
    handleCaptureAttendance
  };
};
