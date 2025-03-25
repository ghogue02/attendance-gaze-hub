import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Updates the avatar image for a builder/student in both the students table
 * and the face_registrations table to ensure consistency
 */
export const updateBuilderAvatar = async (
  studentId: string,
  imageData: string
): Promise<boolean> => {
  try {
    console.log(`Updating avatar for student ${studentId} (image size: ${imageData.length} chars)`);
    
    if (!studentId) {
      console.error('Missing required parameter: studentId');
      toast.error('Failed to update profile image: Student ID is missing');
      return false;
    }
    
    if (!imageData) {
      console.error('Missing required parameter: imageData');
      toast.error('Failed to update profile image: No image data provided');
      return false;
    }
    
    if (!imageData.startsWith('data:image/')) {
      console.error('Invalid image format - not a data URI');
      toast.error('Failed to update profile image: Invalid image format');
      return false;
    }
    
    console.log('Updating student record with new image');
    
    // First fetch current image for comparison
    const { data: currentData, error: fetchError } = await supabase
      .from('students')
      .select('image_url')
      .eq('id', studentId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching current student image:', fetchError);
      // Continue anyway to attempt the update
    } else {
      console.log('Current image exists:', !!currentData?.image_url);
    }
    
    // Update the student's image_url in the students table
    const { data: updateData, error: updateError } = await supabase
      .from('students')
      .update({ 
        image_url: imageData,
        last_face_update: new Date().toISOString()
      })
      .eq('id', studentId)
      .select('id, first_name, last_name');
      
    if (updateError) {
      console.error('Error updating student record:', updateError);
      toast.error('Failed to update profile image in database');
      return false;
    }
    
    if (!updateData || updateData.length === 0) {
      console.error('Student record not found or not updated');
      toast.error('Student record not found');
      return false;
    }
    
    console.log('Student record updated successfully for', updateData[0]?.first_name, updateData[0]?.last_name);
    
    // Also update all face_registration entries for this student to keep data consistent
    try {
      // First, fetch all face registrations for this student
      const { data: registrations, error: fetchError } = await supabase
        .from('face_registrations')
        .select('id')
        .eq('student_id', studentId);
        
      if (fetchError) {
        console.error('Error fetching face registrations:', fetchError);
        // Continue anyway since updating the main student record was successful
      } else if (registrations && registrations.length > 0) {
        console.log(`Found ${registrations.length} face registrations to update`);
        
        // Update all face registrations with the new image
        const { error: updateRegError } = await supabase
          .from('face_registrations')
          .update({ face_data: imageData })
          .eq('student_id', studentId);
          
        if (updateRegError) {
          console.error('Error updating face registrations:', updateRegError);
          toast.error('Failed to update face recognition data');
          // Continue anyway, this is not critical for attendance
        } else {
          console.log('Face registrations updated successfully');
        }
      } else {
        console.log('No existing face registrations found for this student');
        
        // If no face registrations exist, create some for better recognition
        console.log('Creating new face registrations from this image');
        
        // Store multiple copies of the face data for better recognition
        const registrationPromises = [];
        for (let i = 0; i < 5; i++) {
          registrationPromises.push(
            supabase
              .from('face_registrations')
              .insert({
                student_id: studentId,
                face_data: imageData,
                angle_index: i
              })
          );
        }
        
        try {
          await Promise.all(registrationPromises);
          console.log('Created 5 new face registration entries');
        } catch (regError) {
          console.error('Error creating face registrations:', regError);
          // Continue anyway since the profile image was updated
        }
      }
    } catch (regError) {
      console.error('Error handling face registration update:', regError);
      // This is not critical, so we continue
    }
    
    toast.success('Profile image updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating avatar:', error);
    toast.error('An unexpected error occurred while updating your profile');
    return false;
  }
};
