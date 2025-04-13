
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressImage } from '@/hooks/camera/captureImage';

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
      toast.error('Student ID is required');
      return false;
    }
    
    if (!imageData || !imageData.startsWith('data:image/')) {
      console.error('Invalid image data format');
      toast.error('Invalid image data format');
      return false;
    }

    // Get the image size to log it
    const imageSizeKB = Math.round(imageData.length / 1024);
    console.log(`Original image size: ${imageSizeKB}KB`);
    
    // Compress image if it's large
    let processedImage = imageData;
    if (imageSizeKB > 800) {
      console.log(`Image is large (${imageSizeKB}KB), compressing...`);
      try {
        processedImage = await compressImage(imageData, 800);
        const newSizeKB = Math.round(processedImage.length / 1024);
        console.log(`Image compressed from ${imageSizeKB}KB to ${newSizeKB}KB`);
      } catch (compressionError) {
        console.error('Image compression failed:', compressionError);
        // Continue with original image if compression fails
      }
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
    
    // Update the student record with the new image
    const { data: updateData, error: updateError } = await supabase
      .from('students')
      .update({ 
        image_url: processedImage,
        last_face_update: new Date().toISOString()
      })
      .eq('id', studentId)
      .select();
      
    if (updateError) {
      console.error('Error updating student record:', updateError);
      toast.error(`Failed to update profile: ${updateError.message || 'Database error'}`);
      return false;
    }
    
    if (!updateData || updateData.length === 0) {
      console.error('No rows were updated');
      toast.error('No student record was updated');
      return false;
    }
    
    console.log('Student record updated successfully');
    
    // Also update the face_registrations table to ensure consistent images
    try {
      // First delete any existing face registrations with angle_index 0
      // This ensures we're not constantly adding new registrations
      const { error: deleteError } = await supabase
        .from('face_registrations')
        .delete()
        .eq('student_id', studentId)
        .eq('angle_index', 0);
        
      if (deleteError) {
        console.warn('Error clearing previous face registrations:', deleteError);
        // Continue anyway as this is not critical
      }
      
      // Now insert the new registration
      const { error: faceRegError } = await supabase
        .from('face_registrations')
        .insert({
          student_id: studentId,
          face_data: processedImage,
          angle_index: 0 // Default angle index
        });
        
      if (faceRegError) {
        console.error('Error updating face registration:', faceRegError);
        // Continue anyway, as the profile update succeeded
        console.log('Face registration failed but profile was updated successfully');
      } else {
        console.log('Face registration updated successfully');
      }
    } catch (regError) {
      console.error('Exception during face registration update:', regError);
      // Continue as the main profile was updated
    }
    
    return true;
  } catch (error) {
    console.error('Error updating builder avatar:', error);
    toast.error('An unexpected error occurred while updating profile');
    return false;
  }
};
