
import { useEffect } from 'react';
import { Builder } from '@/components/BuilderCard';
import { useCamera } from '@/hooks/camera/useCamera';
import { toast } from 'sonner';
import CapturePhoto from './attendance/CapturePhoto';
import CameraDisplay from './attendance/CameraDisplay';
import { updateBuilderAvatar } from '@/utils/faceRecognition/registration/updateAvatar';
import { markAttendance } from '@/utils/attendance/markAttendance';
import { supabase } from '@/integrations/supabase/client';

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
      console.log('Starting attendance capture process for:', selectedBuilder.name);
      
      // Capture image data
      const imageData = captureImageData();
      if (!imageData) {
        toast.error('Failed to capture image');
        return;
      }
      
      console.log(`Captured image data (${imageData.length} bytes) for ${selectedBuilder.name}`);
      
      // Show processing toast
      const processingToast = toast.loading('Processing your image...', { id: 'profile-update' });
      
      // STEP 1: First update the builder's avatar image in Supabase
      console.log(`Updating profile image for builder ID: ${selectedBuilder.id}`);
      const imageUpdateSuccess = await updateBuilderAvatar(selectedBuilder.id, imageData);
      
      if (!imageUpdateSuccess) {
        console.error('Failed to update builder avatar in Supabase');
        toast.error('Failed to save profile image', { id: 'profile-update' });
        return;
      }
      
      console.log('Builder avatar updated successfully');
      toast.success('Profile image saved successfully', { id: 'profile-update' });
      
      // STEP 2: Verify the image was actually saved in Supabase
      const { data: verifyData, error: verifyError } = await supabase
        .from('students')
        .select('image_url')
        .eq('id', selectedBuilder.id)
        .single();
        
      if (verifyError || !verifyData?.image_url) {
        console.error('Image verification failed:', verifyError || 'No image URL found');
        toast.error('Could not verify image was saved properly');
        return;
      }
      
      console.log(`Image verified in database: ${verifyData.image_url.length} bytes`);
      
      // STEP 3: Mark attendance in Supabase
      console.log(`Marking attendance for builder ID: ${selectedBuilder.id}`);
      const attendanceSuccess = await markAttendance(selectedBuilder.id, 'present');
      
      if (!attendanceSuccess) {
        console.error('Failed to mark attendance');
        toast.error('Failed to record attendance');
        return;
      }
      
      console.log('Attendance marked successfully');
      
      // STEP 4: Create updated builder object with new image and status
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
      toast.success(`Attendance marked for ${updatedBuilder.name}`);
      
    } catch (error) {
      console.error('Error in attendance capture:', error);
      toast.error('An error occurred while marking attendance');
    }
  };

  const handleRestartCamera = () => {
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
      
      <CapturePhoto
        isCapturing={isCapturing}
        selectedBuilder={selectedBuilder}
        onCapture={handleCaptureAttendance}
      />
    </div>
  );
};

export default SimpleAttendanceCamera;
