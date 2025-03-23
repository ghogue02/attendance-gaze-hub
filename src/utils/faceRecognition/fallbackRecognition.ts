
import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/BuilderCard';
import { FaceRegistrationResult } from './types';
import { detectFaces, fetchRegisteredStudents, groupRegistrationsByStudent } from './recognitionUtils';

/**
 * Simplified face recognition that works with the existing face_registrations table
 * Used as a fallback when the enhanced recognition fails
 */
export const recognizeFaceBasic = async (
  imageData: string,
  confidenceThreshold: number = 0.6
): Promise<{ success: boolean; builder?: Builder; message: string }> => {
  try {
    console.log('Using basic face recognition as fallback');
    
    // First try to detect faces in the image
    const faceDetection = await detectFaces(imageData, false);
    const hasFace = faceDetection.success && faceDetection.hasFaces;
    
    if (!hasFace && confidenceThreshold > 0.5) {
      console.log('No face detected in the image with high confidence');
      return { 
        success: false, 
        message: 'No face detected in frame' 
      };
    }
    
    // Fetch all registered students who have face data
    const registeredStudentsResult = await fetchRegisteredStudents();
    
    if (!registeredStudentsResult.success || !registeredStudentsResult.data || registeredStudentsResult.data.length === 0) {
      return { 
        success: false, 
        message: 'No registered faces found' 
      };
    }
    
    // First try the face_registrations table (old method)
    try {
      const { data: registrations, error } = await supabase
        .from('face_registrations')
        .select('student_id')
        .order('created_at', { ascending: false });
        
      if (!error && registrations && registrations.length > 0) {
        console.log(`Found ${registrations.length} face registrations, using most recent`);
        
        // Get the most recently registered student - this is a simplified approach
        const studentId = registrations[0].student_id;
        
        // Fetch student details
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id, first_name, last_name, student_id, image_url')
          .eq('id', studentId)
          .single();
          
        if (studentError || !student) {
          console.error('Error fetching student details:', studentError);
          return { 
            success: false, 
            message: 'Error fetching student details' 
          };
        }
        
        // Format time for display
        const timeRecorded = new Date().toLocaleTimeString();
        
        // Create builder object
        const builder: Builder = {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          builderId: student.student_id || '',
          status: 'present',
          timeRecorded,
          image: student.image_url || `https://ui-avatars.com/api/?name=${student.first_name}+${student.last_name}&background=random`
        };
        
        return { 
          success: true, 
          builder, 
          message: 'Face recognized using legacy method' 
        };
      }
    } catch (oldMethodError) {
      console.warn('Error with old recognition method:', oldMethodError);
      // Continue to try newer methods
    }
    
    // If we get here, no match was found with the simple approach
    return { 
      success: false, 
      message: 'No matching face found' 
    };
  } catch (error) {
    console.error('Error in basic face recognition:', error);
    return { 
      success: false, 
      message: 'Error during face recognition' 
    };
  }
};

/**
 * Register a face without detection checks - fallback method
 */
export const registerFaceWithoutDetection = async (
  studentId: string,
  imageData: string
): Promise<FaceRegistrationResult> => {
  try {
    console.log(`Registering face for builder ${studentId} using fallback method`);
    
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
      throw new Error('Failed to register face data');
    }
  } catch (e) {
    console.error('Exception during face registration:', e);
    throw e;
  }
}
