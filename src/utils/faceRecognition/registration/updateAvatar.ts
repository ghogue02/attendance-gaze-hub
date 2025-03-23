
import { supabase } from '@/integrations/supabase/client';

// Function to update a builder's avatar with a captured face image
export const updateBuilderAvatar = async (builderId: string, imageData: string): Promise<boolean> => {
  try {
    console.log("Starting builder avatar update process");
    
    if (!builderId || !imageData) {
      console.error('Missing required parameters for avatar update');
      return false;
    }
    
    // Update the builder's avatar in the database
    const { error } = await supabase
      .from('students')
      .update({ 
        image_url: imageData,
        last_face_update: new Date().toISOString()
      })
      .eq('id', builderId);
    
    if (error) {
      console.error('Error updating avatar:', error);
      return false;
    }
    
    console.log('Successfully updated avatar in students table');
    
    // Also attempt to update any existing face_registrations to ensure consistency
    try {
      const { data: registrations, error: fetchError } = await supabase
        .from('face_registrations')
        .select('id')
        .eq('student_id', builderId)
        .limit(1);
      
      // If there are existing registrations, update the most recent one with the new image
      if (!fetchError && registrations && registrations.length > 0) {
        const { error: updateError } = await supabase
          .from('face_registrations')
          .update({ face_data: imageData })
          .eq('student_id', builderId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (updateError) {
          console.warn('Note: Could not update face_registrations table:', updateError);
          // Continue anyway, as we've already updated the students table
        } else {
          console.log('Also updated face_registrations table with new image');
        }
      }
    } catch (e) {
      console.warn('Error checking face registrations:', e);
      // Continue anyway as the main update succeeded
    }
    
    return true;
  } catch (error) {
    console.error('Error updating avatar:', error);
    return false;
  }
};
