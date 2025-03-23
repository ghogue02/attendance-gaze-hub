
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
      // First check if there are any face registrations for this student
      const { data: registrations, error: fetchError } = await supabase
        .from('face_registrations')
        .select('id')
        .eq('student_id', builderId);
      
      // If there are existing registrations, update all of them with the new image
      if (!fetchError && registrations && registrations.length > 0) {
        console.log(`Found ${registrations.length} face registrations to update`);
        
        // Update all registrations with the new image
        const { error: updateError } = await supabase
          .from('face_registrations')
          .update({ face_data: imageData })
          .eq('student_id', builderId);
        
        if (updateError) {
          console.warn('Could not update face_registrations table:', updateError);
          // Continue anyway, as we've already updated the students table
        } else {
          console.log(`Updated ${registrations.length} face registrations with new image`);
        }
      } else {
        // If no registrations found, create a new one
        console.log('No existing face registrations found, creating new registration');
        
        const { error: insertError } = await supabase
          .from('face_registrations')
          .insert({
            student_id: builderId,
            face_data: imageData,
            angle_index: 0, // Default angle index
          });
          
        if (insertError) {
          console.warn('Could not create new face registration:', insertError);
        } else {
          console.log('Created new face registration with image');
        }
      }
      
      // Also ensure the face_embeddings table has this image
      try {
        // First check if we already have an embedding for this student
        const { data: existingEmbedding, error: checkError } = await supabase
          .from('face_embeddings')
          .select('id, embedding')
          .eq('student_id', builderId)
          .maybeSingle();
          
        if (checkError) {
          console.warn('Error checking for existing embedding:', checkError);
        } else if (existingEmbedding && existingEmbedding.embedding) {
          // If we have an existing embedding, update it
          const { error: embedError } = await supabase
            .from('face_embeddings')
            .update({
              image_data: imageData,
              created_at: new Date().toISOString()
            })
            .eq('student_id', builderId);
            
          if (embedError) {
            console.warn('Could not update face_embeddings table:', embedError);
          } else {
            console.log('Updated face_embeddings with new image');
          }
        } else {
          // For now, don't try to create a new embedding record without the embedding itself
          // That will happen in the face recognition process
          console.log('No existing embedding found. New embedding will be created during recognition.');
        }
      } catch (embedErr) {
        console.warn('Error updating face embeddings:', embedErr);
      }
    } catch (e) {
      console.warn('Error updating face registrations:', e);
      // Continue anyway as the main update succeeded
    }
    
    return true;
  } catch (error) {
    console.error('Error updating avatar:', error);
    return false;
  }
};
