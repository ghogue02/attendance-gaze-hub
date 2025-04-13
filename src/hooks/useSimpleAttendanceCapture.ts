
import { useState, RefObject } from 'react';
import { Builder } from '@/components/builder/types';
import { updateBuilderAvatar } from '@/utils/faceRecognition/registration/updateAvatar';
import { markAttendance } from '@/utils/attendance';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
        return;
      }
      
      console.log(`Captured image data (${imageData.length} bytes) for ${selectedBuilder.name}`);
      
      // Try to compress image if it's too large
      let processedImage = imageData;
      if (imageData.length > 1500000) { // Over 1.5MB
        console.log('Image is large, attempting to reduce quality');
        processedImage = await reduceImageQuality(imageData);
        console.log(`Reduced image size: ${Math.round(processedImage.length / 1024)}KB`);
      }
      
      // Validate image size
      if (processedImage.length > 5000000) {  // ~5MB
        setError('Image too large. Please try again with a lower resolution.');
        toast.error('Image too large', { id: toastId });
        return;
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
        return;
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
        const errorMsg = 'Failed to record attendance';
        console.error(errorMsg);
        toast.error(errorMsg, { id: toastId });
        // Continue anyway since image was updated successfully
      } else {
        console.log('Attendance marked successfully in database');
      }
      
      // Try fetching the updated image URL from the database
      let imageUrl = null;
      try {
        const { data: studentData } = await supabase
          .from('students')
          .select('image_url')
          .eq('id', selectedBuilder.id)
          .single();
        
        imageUrl = studentData?.image_url;
        console.log('Retrieved updated image URL from database');
      } catch (err) {
        console.warn('Could not fetch updated image URL', err);
        // Continue with the captured image data as fallback
      }
      
      // Step 4: Create updated builder object with new image and status
      const updatedBuilder: Builder = {
        ...selectedBuilder,
        image: processedImage, // Use processed image directly
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
      
    } catch (error) {
      console.error('Error in attendance capture:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(`Error: ${errorMsg}`);
      toast.error('Failed to process attendance');
    } finally {
      setProcessing(false);
    }
  };

  // Helper function to reduce image quality
  const reduceImageQuality = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Resize if image is very large
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 720;
        let width = img.width;
        let height = img.height;
        
        // Scale down if needed
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl); // Fallback to original
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        // Reduce quality to 70%
        const reducedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(reducedDataUrl);
      };
      img.src = dataUrl;
    });
  };

  return {
    error,
    processing,
    handleCaptureAttendance,
    setError
  };
};
