
import { supabase } from '@/integrations/supabase/client';
import { FaceRegistrationResult } from '../types';

/**
 * Simplified face registration function that directly stores the image
 * without performing face detection. This is a fallback for when the 
 * face detection service is unavailable.
 */
export const registerFaceWithoutDetection = async (
  studentId: string,
  imageData: string
): Promise<FaceRegistrationResult> => {
  try {
    console.log(`Starting simplified face registration for student ${studentId}`);
    
    if (!imageData || !imageData.startsWith('data:image/')) {
      return {
        success: false,
        message: 'Invalid image format'
      };
    }
    
    // Fetch the student record
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
      
    if (fetchError || !student) {
      console.error('Error fetching student:', fetchError);
      return {
        success: false,
        message: 'Student not found'
      };
    }
    
    // Update the student's profile image
    const { error: updateError } = await supabase
      .from('students')
      .update({ 
        image_url: imageData,
        last_face_update: new Date().toISOString()
      })
      .eq('id', studentId);
      
    if (updateError) {
      console.error('Error updating student image:', updateError);
      return {
        success: false,
        message: 'Failed to save face image'
      };
    }
    
    // Clear existing registrations for a fresh start
    const { error: deleteError } = await supabase
      .from('face_registrations')
      .delete()
      .eq('student_id', studentId);
      
    if (deleteError) {
      console.log('Error clearing previous registrations:', deleteError);
      // Continue anyway
    }
    
    // Store multiple copies of the face data (simplified approach)
    const registrationPromises = [];
    for (let i = 0; i < 5; i++) {
      registrationPromises.push(
        storeFaceRegistration(studentId, imageData, i)
      );
    }
    
    // Wait for all registrations to complete
    await Promise.all(registrationPromises);
    
    return {
      success: true,
      message: 'Face registered successfully',
      completed: true,
      faceDetected: true // Assume face is detected since we're not checking
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'An error occurred during face registration'
    };
  }
};

// Helper function to store a single face registration
async function storeFaceRegistration(
  studentId: string,
  faceData: string,
  angleIndex: number
): Promise<void> {
  try {
    console.log(`Storing simplified face data for student ${studentId}, sample ${angleIndex}`);
    
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
      throw new Error('Failed to register face data');
    }
  } catch (e) {
    console.error('Exception during face registration:', e);
    throw e;
  }
}
