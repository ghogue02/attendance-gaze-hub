
import { useState } from 'react';
import { Builder } from '@/components/builder/types';
import { toast } from 'sonner';
import { 
  updateBuilderImage, 
  verifyImageSaved, 
  recordBuilderAttendance, 
  createUpdatedBuilderObject,
  fetchBuilderById
} from './utils';

interface UseAttendanceProcessorProps {
  onAttendanceMarked: (builder: Builder) => void;
}

export const useAttendanceProcessor = ({ onAttendanceMarked }: UseAttendanceProcessorProps) => {
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>('Position yourself in the frame');

  const processSelectedBuilder = async (
    selectedBuilder: Builder,
    imageData: string | null
  ): Promise<boolean> => {
    if (!imageData) {
      toast.error('Failed to capture image');
      setStatusMessage('Failed to capture image. Please try again.');
      return false;
    }
    
    console.log('Image captured successfully, size:', imageData.length, 'chars');
    console.log('Using pre-selected builder:', selectedBuilder.id, selectedBuilder.name);
    
    // Update the builder's profile image
    const imageUpdateSuccess = await updateBuilderImage(selectedBuilder.id, imageData);
    if (!imageUpdateSuccess) return false;
    
    // Verify the image was saved
    await verifyImageSaved(selectedBuilder.id);
    
    // Mark attendance
    const attendanceResult = await recordBuilderAttendance(selectedBuilder.id);
    if (!attendanceResult) return false;
    
    // Update the builder object with the new image and status
    const updatedBuilder = createUpdatedBuilderObject(selectedBuilder, imageData);
    
    // Notify success
    toast.success(`Attendance marked for ${updatedBuilder.name}`);
    setStatusMessage('Attendance successfully marked!');
    
    // Call the callback with the updated builder information
    onAttendanceMarked(updatedBuilder);
    return true;
  };

  const processManualBuilder = async (imageData: string | null): Promise<boolean> => {
    if (!imageData) {
      toast.error('Failed to capture image');
      setStatusMessage('Failed to capture image. Please try again.');
      return false;
    }
    
    // Prompt for builder ID
    const builderIdInput = prompt('Enter your Builder ID:');
    if (!builderIdInput) {
      setStatusMessage('Attendance marking cancelled.');
      return false;
    }
    
    // Fetch the builder from the database
    const builder = await fetchBuilderById(builderIdInput);
    if (!builder) {
      setStatusMessage('Builder not found. Please try again.');
      return false;
    }
    
    // Update profile image
    const imageUpdateSuccess = await updateBuilderImage(builder.id, imageData);
    if (!imageUpdateSuccess) return false;
    
    // Mark attendance
    const attendanceResult = await recordBuilderAttendance(builder.id);
    if (!attendanceResult) return false;
    
    // Create updated builder with image
    const updatedBuilder = createUpdatedBuilderObject(builder, imageData);
    
    // Notify success
    toast.success(`Attendance marked for ${updatedBuilder.name}`);
    setStatusMessage('Attendance successfully marked!');
    
    // Call the callback with the updated builder information
    onAttendanceMarked(updatedBuilder);
    return true;
  };

  return {
    processing,
    statusMessage,
    setProcessing,
    setStatusMessage,
    processSelectedBuilder,
    processManualBuilder
  };
};
