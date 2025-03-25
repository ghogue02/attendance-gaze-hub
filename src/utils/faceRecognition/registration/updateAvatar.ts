
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Update the profile image for a student
 * This function saves the image to both the students table
 * and creates face registration data
 */
export const updateBuilderAvatar = async (
  studentId: string,
  imageData: string
): Promise<boolean> => {
  try {
    console.log(`Starting avatar update for student ${studentId}`);
    
    if (!studentId) {
      console.error('Student ID is required');
      return false;
    }
    
    if (!imageData || !imageData.startsWith('data:image/')) {
      console.error('Invalid image data format');
      return false;
    }
    
    // First, check if the student exists to provide a better error message
    const { data: studentCheck, error: checkError } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .eq('id', studentId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking student record:', checkError);
      toast.error('Database error: Could not verify student record');
      return false;
    }
    
    if (!studentCheck) {
      console.error(`Student with ID ${studentId} not found in database`);
      toast.error('Student not found in database');
      return false;
    }
    
    console.log('Found student record:', studentCheck.first_name, studentCheck.last_name);
    console.log('Updating student record with new image');
    
    // Update the student record with the new image
    const { error: updateError } = await supabase
      .from('students')
      .update({ 
        image_url: imageData,
        last_face_update: new Date().toISOString()
      })
      .eq('id', studentId);
      
    if (updateError) {
      console.error('Error updating student record:', updateError);
      toast.error('Failed to update student record');
      return false;
    }
    
    // Verify the update was successful
    const { data: verifyData, error: verifyError } = await supabase
      .from('students')
      .select('image_url')
      .eq('id', studentId)
      .maybeSingle();
      
    if (verifyError || !verifyData?.image_url) {
      console.error('Error verifying student record update:', verifyError);
      toast.error('Failed to verify profile image update');
      return false;
    }
    
    console.log('Student record updated successfully');
    
    // Also update the face_registrations table to ensure consistent images
    // This is done asynchronously, we don't wait for it
    supabase
      .from('face_registrations')
      .insert({
        student_id: studentId,
        face_data: imageData,
        angle_index: 0 // Default angle index
      })
      .then(({ error }) => {
        if (error) {
          console.error('Error updating face registration:', error);
        } else {
          console.log('Face registration updated successfully');
        }
      });
    
    return true;
  } catch (error) {
    console.error('Error updating builder avatar:', error);
    toast.error('An unexpected error occurred while updating profile');
    return false;
  }
};
