
import { useEffect, useState } from 'react';
import { Builder } from '@/components/builder/types';
import { useCamera } from '@/hooks/camera/useCamera';
import { toast } from 'sonner';
import CapturePhoto from './attendance/CapturePhoto';
import CameraDisplay from './attendance/CameraDisplay';
import { updateBuilderAvatar } from '@/utils/faceRecognition/registration/updateAvatar';
import { markAttendance } from '@/utils/attendance/markAttendance';
import { supabase } from '@/integrations/supabase/client';
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

  // Log whenever the component renders with updated props
  useEffect(() => {
    console.log('SimpleAttendanceCamera rendering with:', {
      isCameraActive,
      selectedBuilder: selectedBuilder?.id
    });
    
    // Clear any previous errors when props change
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
      toast.loading('Capturing image...', { id: 'profile-update' });
      
      console.log('Starting attendance capture process for:', selectedBuilder.name);
      
      // Capture image data
      const imageData = captureImageData();
      if (!imageData) {
        setError('Failed to capture image');
        toast.error('Failed to capture image', { id: 'profile-update' });
        return;
      }
      
      console.log(`Captured image data (${imageData.length} bytes) for ${selectedBuilder.name}`);
      
      // Validate image size
      if (imageData.length > 5000000) {  // ~5MB
        setError('Image too large. Please try again with a lower resolution.');
        toast.error('Image too large', { id: 'profile-update' });
        return;
      }
      
      toast.loading('Updating profile...', { id: 'profile-update' });
      
      // STEP 1: First update the builder's avatar image in Supabase
      console.log(`Updating profile image for builder ID: ${selectedBuilder.id}`);
      const imageUpdateSuccess = await updateBuilderAvatar(selectedBuilder.id, imageData);
      
      if (!imageUpdateSuccess) {
        const errorMsg = 'Failed to update profile image in database';
        console.error(errorMsg);
        toast.error(errorMsg, { id: 'profile-update' });
        setError(errorMsg);
        return;
      }
      
      console.log('Builder avatar updated successfully');
      toast.success('Profile image saved successfully', { id: 'profile-update' });
      
      // STEP 2: Mark attendance in Supabase
      console.log(`Marking attendance for builder ID: ${selectedBuilder.id}`);
      toast.loading('Recording attendance...', { id: 'attendance-update' });
      
      const attendanceSuccess = await markAttendance(selectedBuilder.id, 'present');
      
      if (!attendanceSuccess) {
        const errorMsg = 'Failed to record attendance';
        console.error(errorMsg);
        toast.error(errorMsg, { id: 'attendance-update' });
        setError(errorMsg);
        // Continue anyway since image was updated successfully
      } else {
        console.log('Attendance marked successfully');
        toast.success('Attendance recorded successfully', { id: 'attendance-update' });
      }
      
      // STEP 3: Create updated builder object with new image and status
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
      const errorMsg = 'An error occurred while marking attendance';
      console.error('Error in attendance capture:', error);
      toast.error(errorMsg);
      setError(errorMsg);
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
