
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
    console.log(`Starting avatar update for student ${studentId}`);
    
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
    
    // Verify that the image data is not too large (Supabase has a limit)
    const sizeInBytes = Math.ceil((imageData.length * 3) / 4);
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    if (sizeInMB > 6) {
      console.error(`Image too large: ${sizeInMB.toFixed(2)}MB (maximum 6MB)`);
      toast.error('Image too large. Please use a smaller image or reduce quality.');
      return false;
    }
    
    // 1. Update the student record with the new image
    console.log('Updating student record with new image');
    const { data: updateData, error: updateError } = await supabase
      .from('students')
      .update({ 
        image_url: imageData,
        last_face_update: new Date().toISOString()
      })
      .eq('id', studentId)
      .select('id, first_name, last_name, image_url');
      
    if (updateError) {
      console.error('Error updating student record:', updateError);
      
      // More specific error messages
      if (updateError.code === '23505') {
        toast.error('Database conflict error. Please try again.');
      } else if (updateError.code === '23503') {
        toast.error('Student record not found.');
      } else if (updateError.code === '22001') {
        toast.error('Image data too large for database. Try reducing quality.');
      } else {
        toast.error(`Database error: ${updateError.message}`);
      }
      return false;
    }
    
    if (!updateData || updateData.length === 0) {
      console.error('Student record not found or not updated');
      toast.error('Student record not found');
      return false;
    }
    
    // Verify the data was actually saved (not just that the update succeeded)
    if (!updateData[0]?.image_url) {
      console.error('Image URL is empty after update!');
      toast.error('Failed to save image properly');
      return false;
    }
    
    console.log('Student record updated successfully', {
      name: `${updateData[0]?.first_name} ${updateData[0]?.last_name}`,
      imageSize: updateData[0]?.image_url?.length || 0
    });
    
    // 2. Now update face_registrations entries for this student
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
        
        // Update face registrations in smaller batches to prevent timeouts
        const batchSize = 5;
        for (let i = 0; i < registrations.length; i += batchSize) {
          const batch = registrations.slice(i, i + batchSize);
          const ids = batch.map(reg => reg.id);
          
          console.log(`Updating batch ${i/batchSize + 1} of face registrations (${ids.length} items)`);
          
          const { error: updateRegError } = await supabase
            .from('face_registrations')
            .update({ face_data: imageData })
            .in('id', ids);
            
          if (updateRegError) {
            console.error(`Error updating face registrations batch ${i/batchSize + 1}:`, updateRegError);
          }
        }
        
        console.log('Face registrations update completed');
      } else {
        console.log('No existing face registrations found for this student');
        
        // If no face registrations exist, create some for better recognition
        console.log('Creating new face registrations from this image');
        
        // Store multiple copies of the face data for better recognition
        // Use a single insert with multiple rows for better performance
        try {
          const newRegistrations = [];
          for (let i = 0; i < 5; i++) {
            newRegistrations.push({
              student_id: studentId,
              face_data: imageData,
              angle_index: i
            });
          }
          
          const { error: insertError } = await supabase
            .from('face_registrations')
            .insert(newRegistrations);
            
          if (insertError) {
            console.error('Error creating face registrations:', insertError);
          } else {
            console.log('Created 5 new face registration entries');
          }
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
