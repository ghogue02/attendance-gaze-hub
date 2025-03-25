
import { useState } from 'react';
import { Builder } from '@/components/BuilderCard';
import { markAttendance } from '@/utils/attendance/markAttendance';
import { updateBuilderAvatar } from '@/utils/faceRecognition/registration/updateAvatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCamera } from '@/hooks/camera';
import CameraViewport from './CameraViewport';
import CaptureButton from './CaptureButton';

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
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>('Position yourself in the frame');
  
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
      
      if (!imageData) {
        toast.error('Failed to capture image');
        setStatusMessage('Failed to capture image. Please try again.');
        setProcessing(false);
        return;
      }
      
      console.log('Image captured successfully, size:', imageData.length, 'chars');
      
      let builder: Builder;
      
      if (selectedBuilder) {
        // Use the pre-selected builder
        builder = selectedBuilder;
        
        // First update the builder's profile image with the captured image
        // This needs to happen before marking attendance to ensure image is saved
        console.log('Updating profile image for student:', builder.id);
        const imageUpdateSuccess = await updateBuilderAvatar(builder.id, imageData);
        
        if (!imageUpdateSuccess) {
          console.error('Error updating profile image');
          toast.error('Error updating your profile image');
          // Continue since we still want to mark attendance
        } else {
          console.log('Profile image updated successfully');
        }
        
        // Then mark attendance with explicit "present" status
        console.log('Marking attendance for student:', builder.id);
        const attendanceResult = await markAttendance(builder.id, 'present');
        
        if (!attendanceResult) {
          console.error('Failed to mark attendance');
          toast.error('Failed to mark attendance');
          setProcessing(false);
          return;
        } else {
          console.log('Attendance marked successfully');
        }
        
        // Update the builder object with the new image and status
        builder = {
          ...builder,
          image: imageData,
          status: 'present',
          timeRecorded: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        };
      } else {
        // If no builder is selected, prompt for builder ID (fallback)
        const builderIdInput = prompt('Enter your Builder ID:');
        if (!builderIdInput) {
          setStatusMessage('Attendance marking cancelled.');
          setProcessing(false);
          return;
        }
        
        // Search for the builder in the database
        const { data: builderData, error } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', builderIdInput)
          .maybeSingle();
          
        if (error || !builderData) {
          toast.error('Builder not found. Please check your ID.');
          setStatusMessage('Builder not found. Please try again.');
          setProcessing(false);
          return;
        }
        
        // First update the builder's profile image with the captured image
        console.log('Updating profile image for student:', builderData.id);
        const imageUpdateSuccess = await updateBuilderAvatar(builderData.id, imageData);
        
        if (!imageUpdateSuccess) {
          console.error('Error updating profile image');
          toast.error('Error updating your profile image');
          // Continue since we still want to mark attendance
        } else {
          console.log('Profile image updated successfully');
        }
        
        // Then mark attendance with explicit "present" status
        console.log('Marking attendance for student:', builderData.id);
        const attendanceResult = await markAttendance(builderData.id, 'present');
        
        if (!attendanceResult) {
          console.error('Failed to mark attendance');
          toast.error('Failed to mark attendance');
          setProcessing(false);
          return;
        }
        
        // Create builder object from the database result
        builder = {
          id: builderData.id,
          name: `${builderData.first_name} ${builderData.last_name}`,
          builderId: builderData.student_id || '',
          status: 'present',
          timeRecorded: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          image: imageData
        };
      }
      
      // Notify success
      toast.success(`Attendance marked for ${builder.name}`);
      setStatusMessage('Attendance successfully marked!');
      
      // Call the callback with the updated builder information
      onAttendanceMarked(builder);
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Error marking attendance. Please try again.');
      setStatusMessage('An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
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
