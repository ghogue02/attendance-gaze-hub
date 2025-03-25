
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
      .select('id')
      .eq('id', studentId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking student record:', checkError);
      return false;
    }
    
    if (!studentCheck) {
      console.error(`Student with ID ${studentId} not found in database`);
      toast.error('Student record not found in database');
      return false;
    }
    
    console.log('Updating student record with new image');
    
    // Update the student record with the new image
    const { data, error } = await supabase
      .from('students')
      .update({ 
        image_url: imageData,
        last_face_update: new Date().toISOString()
      })
      .eq('id', studentId)
      .select('id, first_name, last_name, image_url');
      
    if (error || !data || data.length === 0) {
      console.error('Student record not found or not updated', error);
      return false;
    }
    
    console.log('Student record updated successfully:', data[0].id);
    
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
    return false;
  }
};
