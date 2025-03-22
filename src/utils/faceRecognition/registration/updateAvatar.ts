
import { supabase } from '@/integrations/supabase/client';

// Function to update a builder's avatar with a captured face image
export const updateBuilderAvatar = async (builderId: string, imageData: string): Promise<boolean> => {
  try {
    console.log("Starting builder avatar update process");
    
    // Update the builder's avatar in the database without AI enhancement
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
    
    console.log('Successfully updated avatar');
    return true;
  } catch (error) {
    console.error('Error updating avatar:', error);
    return false;
  }
};
