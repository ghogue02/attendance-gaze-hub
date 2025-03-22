
import { Builder } from '@/components/BuilderCard';
import { supabase } from '@/integrations/supabase/client';

/**
 * Simplified face registration that doesn't depend on face detection
 * This is a fallback method when the Google Cloud Vision API isn't working
 */
export const registerFaceWithoutDetection = async (
  builderId: string, 
  imageData: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Registering face for builder ${builderId} using fallback method`);
    
    // First, update the builder's profile image
    const { error: updateError } = await supabase
      .from('students')
      .update({ 
        image_url: imageData,
        last_face_update: new Date().toISOString()
      })
      .eq('id', builderId);
      
    if (updateError) {
      console.error('Error updating student image:', updateError);
      return {
        success: false,
        message: 'Failed to save face image'
      };
    }
    
    // Clear existing registrations to ensure fresh data
    const { error: deleteError } = await supabase
      .from('face_registrations')
      .delete()
      .eq('student_id', builderId);
      
    if (deleteError) {
      console.log('Error clearing previous registrations:', deleteError);
      // Continue anyway
    }
    
    // Store multiple copies of the face data for better recognition
    const registrationPromises = [];
    for (let i = 0; i < 5; i++) {
      registrationPromises.push(
        storeFaceRegistration(builderId, imageData, i)
      );
    }
    
    // Wait for all registrations to complete
    await Promise.all(registrationPromises);
    
    return {
      success: true,
      message: 'Face registered successfully',
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'An error occurred during face registration'
    };
  }
};

// Helper function to store face registration data
async function storeFaceRegistration(
  studentId: string,
  faceData: string,
  angleIndex: number
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`Storing face data for student ${studentId}, sample ${angleIndex}`);
    
    // Insert the face registration
    const { error: insertError } = await supabase
      .from('face_registrations')
      .insert({
        student_id: studentId,
        face_data: faceData,
        angle_index: angleIndex
      });
      
    if (insertError) {
      console.error('Error inserting face registration:', insertError);
      return {
        success: false,
        message: 'Failed to register face data'
      };
    }

    return {
      success: true,
      message: 'Face data stored successfully'
    };
  } catch (e) {
    console.error('Exception during face registration:', e);
    return {
      success: false,
      message: 'Exception during face registration'
    };
  }
}
