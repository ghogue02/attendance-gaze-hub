
import { Builder } from '@/components/builder/types';
import { markAttendance } from '@/utils/attendance';
import { updateBuilderAvatar } from '@/utils/faceRecognition/registration/updateAvatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Updates the builder's avatar with the captured image
 */
export const updateBuilderImage = async (builderId: string, imageData: string): Promise<boolean> => {
  console.log('Updating profile image for student:', builderId);
  const imageUpdateSuccess = await updateBuilderAvatar(builderId, imageData);
  
  if (!imageUpdateSuccess) {
    console.error('Failed to update profile image in Supabase');
    toast.error('Failed to save your image to the database');
    return false;
  }
  
  console.log('Profile image updated successfully in Supabase');
  return true;
};

/**
 * Verifies the image was saved correctly
 */
export const verifyImageSaved = async (builderId: string): Promise<boolean> => {
  const { data: verifyData, error: verifyError } = await supabase
    .from('students')
    .select('image_url')
    .eq('id', builderId)
    .single();
    
  if (verifyError || !verifyData.image_url) {
    console.error('Image verification failed:', verifyError || 'No image URL found');
    // Continue anyway since we did attempt to save the image
    return false;
  }
  
  console.log('Image verified in database, length:', verifyData.image_url.length);
  return true;
};

/**
 * Marks attendance for a builder
 */
export const recordBuilderAttendance = async (builderId: string): Promise<boolean> => {
  console.log('Marking attendance for student:', builderId);
  const attendanceResult = await markAttendance(builderId, 'present');
  
  if (!attendanceResult) {
    console.error('Failed to mark attendance in database');
    toast.error('Failed to mark attendance');
    return false;
  }
  
  console.log('Attendance marked successfully in database');
  return true;
};

/**
 * Creates a Builder object with updated attendance information
 */
export const createUpdatedBuilderObject = (builder: Builder, imageData: string): Builder => {
  return {
    ...builder,
    image: imageData,
    status: 'present',
    timeRecorded: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };
};

/**
 * Fetches a builder by their ID from Supabase
 */
export const fetchBuilderById = async (builderId: string): Promise<Builder | null> => {
  const { data: builderData, error } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', builderId)
    .maybeSingle();
    
  if (error || !builderData) {
    toast.error('Builder not found. Please check your ID.');
    return null;
  }
  
  return {
    id: builderData.id,
    name: `${builderData.first_name} ${builderData.last_name}`,
    builderId: builderData.student_id || '',
    status: 'present',
    timeRecorded: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    image: builderData.image_url
  };
};
