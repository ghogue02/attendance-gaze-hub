
import { useState } from 'react';
import { Builder } from '@/components/builder/types';
import { updateBuilderAvatar } from '@/utils/faceRecognition/registration/updateAvatar';
import { markAttendance } from '@/utils/attendance';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/hooks/camera/captureImage';
import { getCachedData, setCachedData } from '@/utils/attendance/cacheManager';

interface UseSimpleAttendanceCaptureProps {
  onAttendanceMarked: (builder: Builder) => void;
  selectedBuilder?: Builder | null;
  captureImageData: () => string | null;
  isCapturing: boolean;
}

export const useSimpleAttendanceCapture = ({
  onAttendanceMarked,
  selectedBuilder,
  captureImageData,
  isCapturing
}: UseSimpleAttendanceCaptureProps) => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleCaptureAttendance = async () => {
    if (!isCapturing || !selectedBuilder) {
      toast.error(selectedBuilder ? 'Camera not ready' : 'No builder selected');
      return;
    }

    try {
      setError(null);
      setProcessing(true);
      
      // Show processing toast
      const toastId = toast.loading('Capturing image...');
      
      console.log('Starting attendance capture process for:', selectedBuilder.name);
      
      // Step 1: Capture image data
      const imageData = captureImageData();
      if (!imageData) {
        setError('Failed to capture image');
        toast.error('Failed to capture image', { id: toastId });
        return false;
      }
      
      console.log(`Captured image data (${Math.round(imageData.length / 1024)}KB) for ${selectedBuilder.name}`);
      
      // Always compress the image to a reasonable size
      toast.loading('Processing image...', { id: toastId });
      let processedImage: string;
      try {
        processedImage = await compressImage(imageData, 800);
        console.log(`Compressed image size: ${Math.round(processedImage.length / 1024)}KB`);
      } catch (compressionError) {
        console.error('Image compression failed:', compressionError);
        // Fall back to original image if compression fails
        processedImage = imageData;
      }
      
      // Validate image size
      if (processedImage.length > 2000000) {  // ~2MB
        setError('Image too large. Please try again with lower light or different position.');
        toast.error('Image too large', { id: toastId });
        return false;
      }
      
      toast.loading('Updating profile...', { id: toastId });
      
      // Step 2: Update the builder's avatar image in Supabase
      console.log(`Updating profile image for builder ID: ${selectedBuilder.id}`);
      const imageUpdateSuccess = await updateBuilderAvatar(selectedBuilder.id, processedImage);
      
      if (!imageUpdateSuccess) {
        const errorMsg = 'Failed to update profile image. Please try again.';
        console.error(errorMsg);
        toast.error(errorMsg, { id: toastId });
        setError(errorMsg);
        return false;
      }
      
      console.log('Builder avatar updated successfully');
      toast.loading('Recording attendance...', { id: toastId });
      
      // Step 3: Mark attendance in Supabase with explicit "present" status
      // Ensure we're using the current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split('T')[0];
      console.log(`Marking attendance for builder ID: ${selectedBuilder.id} as present for date ${currentDate}`);
      
      // Mark attendance
      const attendanceSuccess = await markAttendance(selectedBuilder.id, 'present');
      
      if (!attendanceSuccess) {
        console.warn('Failed to record attendance, but profile was updated successfully');
      } else {
        console.log('Attendance marked successfully in database');
      }
      
      // Cache the profile image URL to avoid immediate refetch
      const cacheKey = `builder_profile_${selectedBuilder.id}`;
      setCachedData(cacheKey, processedImage, 60000); // Cache for 1 minute
      
      // Step 4: Create updated builder object with new image and status
      const updatedBuilder: Builder = {
        ...selectedBuilder,
        image: processedImage,
        status: 'present',
        timeRecorded: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      };
      
      console.log('Updated builder object created');
      
      // Notify the parent component
      onAttendanceMarked(updatedBuilder);
      toast.success(`Welcome, ${updatedBuilder.name}!`, { id: toastId });
      return true;
      
    } catch (error) {
      console.error('Error in attendance capture:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(`Error: ${errorMsg}`);
      toast.error('Failed to process attendance');
      return false;
    } finally {
      setProcessing(false);
    }
  };

  return {
    error,
    processing,
    handleCaptureAttendance,
    setError
  };
};
