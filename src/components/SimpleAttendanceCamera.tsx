
import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCamera } from '@/hooks/camera';
import { markAttendance } from '@/utils/attendance/markAttendance';
import { Builder } from '@/components/BuilderCard';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { updateBuilderAvatar } from '@/utils/faceRecognition/registration/updateAvatar';

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
  
  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);
  
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
  
  const handleRetryCamera = () => {
    setStatusMessage('Restarting camera...');
    stopCamera();
    
    setTimeout(() => {
      startCamera();
    }, 1000);
  };
  
  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden aspect-video bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {isCapturing && !cameraError && (
          <div className="absolute inset-0 border-2 border-primary pointer-events-none animate-pulse opacity-50" />
        )}
        
        {statusMessage && !cameraError && !processing && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              {statusMessage}
            </div>
          </div>
        )}
        
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center">
            <div>
              <p className="mb-3">{cameraError}</p>
              <Button
                onClick={handleRetryCamera}
                className="flex items-center gap-2 text-sm mx-auto"
              >
                <RefreshCw size={16} />
                Retry
              </Button>
            </div>
          </div>
        )}
        
        {processing && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-white">{statusMessage || 'Processing...'}</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-center">
        <Button
          onClick={handleCaptureAttendance}
          disabled={!isCapturing || processing}
          className="flex items-center gap-2"
          size="lg"
        >
          {processing ? (
            <span>Processing...</span>
          ) : (
            <>
              <Camera size={18} />
              <span>Mark Attendance</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SimpleAttendanceCamera;
