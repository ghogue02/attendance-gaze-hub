
import { useEffect, useState } from 'react';
import { Builder } from '@/components/builder/types';
import { useCamera } from '@/hooks/camera/useCamera';
import { toast } from 'sonner';
import CapturePhoto from './attendance/CapturePhoto';
import CameraDisplay from './attendance/CameraDisplay';
import { updateBuilderAvatar } from '@/utils/faceRecognition/registration/updateBuilderAvatar';
import { markAttendance } from '@/utils/attendance/markAttendance';
import { AlertCircle } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
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
    }
  });

  useEffect(() => {
    console.log('SimpleAttendanceCamera rendering with:', {
      isCameraActive,
      selectedBuilder: selectedBuilder?.id
    });
    
    setError(null);
    
    return () => {
      stopCamera();
    };
  }, [isCameraActive, selectedBuilder?.id, stopCamera]);

  const handleCaptureAttendance = async () => {
    if (!isCapturing || !selectedBuilder) {
      toast.error(selectedBuilder ? 'Camera not ready' : 'No builder selected');
      return;
    }

    try {
      setError(null);
      setProcessing(true);
      
      // Show processing toast
      const toastId = 'attendance-process';
      toast.loading('Capturing image...', { id: toastId });
      
      console.log('Starting attendance capture process for:', selectedBuilder.name);
      
      // Step 1: Capture image data
      const imageData = captureImageData();
      if (!imageData) {
        setError('Failed to capture image');
        toast.error('Failed to capture image', { id: toastId });
        return;
      }
      
      console.log(`Captured image data (${imageData.length} bytes) for ${selectedBuilder.name}`);
      
      // Validate image size
      if (imageData.length > 5000000) {  // ~5MB
        setError('Image too large. Please try again with a lower resolution.');
        toast.error('Image too large', { id: toastId });
        return;
      }
      
      toast.loading('Updating profile...', { id: toastId });
      
      // Step 2: Update the builder's avatar image in Supabase
      console.log(`Updating profile image for builder ID: ${selectedBuilder.id}`);
      const imageUpdateSuccess = await updateBuilderAvatar(selectedBuilder.id, imageData);
      
      if (!imageUpdateSuccess) {
        const errorMsg = 'Failed to update profile image. Please try again.';
        console.error(errorMsg);
        toast.error(errorMsg, { id: toastId });
        setError(errorMsg);
        setProcessing(false);
        return;
      }
      
      console.log('Builder avatar updated successfully');
      toast.success('Profile image saved successfully', { id: toastId });
      
      // Step 3: Mark attendance in Supabase
      console.log(`Marking attendance for builder ID: ${selectedBuilder.id}`);
      toast.loading('Recording attendance...', { id: toastId });
      
      const attendanceSuccess = await markAttendance(selectedBuilder.id, 'present');
      
      if (!attendanceSuccess) {
        const errorMsg = 'Failed to record attendance';
        console.error(errorMsg);
        toast.error(errorMsg, { id: toastId });
        // Continue anyway since image was updated successfully
      } else {
        console.log('Attendance marked successfully');
        toast.success('Attendance recorded!', { id: toastId });
      }
      
      // Step 4: Create updated builder object with new image and status
      const updatedBuilder: Builder = {
        ...selectedBuilder,
        image: imageData,
        status: 'present',
        timeRecorded: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      };
      
      // Notify the parent component
      onAttendanceMarked(updatedBuilder);
      toast.success(`Welcome, ${updatedBuilder.name}!`);
      
    } catch (error) {
      console.error('Error in attendance capture:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(`Error: ${errorMsg}`);
      toast.error('Failed to process attendance');
    } finally {
      setProcessing(false);
    }
  };

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
      />
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
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
