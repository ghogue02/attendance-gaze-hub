import { supabase } from '@/integrations/supabase/client';

/**
 * Updates the avatar image for a builder/student in both the students table
 * and the face_registrations table to ensure consistency
 */
export const updateBuilderAvatar = async (
  studentId: string,
  imageData: string
): Promise<boolean> => {
  try {
    console.log(`Updating avatar for student ${studentId}`);
    
    if (!studentId || !imageData) {
      console.error('Missing required parameters');
      return false;
    }
    
    if (!imageData.startsWith('data:image/')) {
      console.error('Invalid image format');
      return false;
    }
    
    console.log('Updating student record with new image');
    
    // Update the student's image_url in the students table
    const { error: updateError } = await supabase
      .from('students')
      .update({ 
        image_url: imageData,
        last_face_update: new Date().toISOString()
      })
      .eq('id', studentId);
      
    if (updateError) {
      console.error('Error updating student record:', updateError);
      return false;
    }
    
    console.log('Student record updated successfully');
    
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
          // Continue anyway, this is not critical
        } else {
          console.log('Face registrations updated successfully');
        }
      } else {
        console.log('No existing face registrations found for this student');
      }
    } catch (regError) {
      console.error('Error handling face registration update:', regError);
      // This is not critical, so we continue
    }
    
    return true;
  } catch (error) {
    console.error('Error updating avatar:', error);
    return false;
  }
};
