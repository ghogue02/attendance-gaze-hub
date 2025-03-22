
import { supabase } from '@/integrations/supabase/client';
import { FaceRegistrationResult } from '../types';
import { detectFaces } from '../recognitionUtils';

// Function to register a face image for a student with simplified approach
export const registerFaceImage = async (
  studentId: string, 
  imageData: string,
  isReregistration: boolean = false
): Promise<FaceRegistrationResult> => {
  try {
    console.log(`Starting face registration for student ${studentId}`);
    
    // Check if the image contains a face
    const faceDetection = await detectFaces(imageData, true, 3);
    
    // If face detection service is unavailable, assume there's a face (more permissive)
    if (!faceDetection.success) {
      console.log(`Face detection service unavailable, proceeding with registration`);
      // Continue with registration even if detection failed
    } else if (!faceDetection.hasFaces) {
      console.log(`No face detected in the image`);
      return {
        success: false,
        message: 'No face detected. Please position your face in the frame.',
        faceDetected: false
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
    
    // Generate a unique storage name
    const timestamp = Date.now();
    const storageName = `${studentId}_${timestamp}.jpg`;
    console.log(`Processing registration image, storage name: ${storageName}`);
    
    // Test if the image is valid
    if (!imageData.startsWith('data:image/')) {
      return {
        success: false,
        message: 'Invalid image format'
      };
    }
    
    // For initial registration, use the image as profile picture
    if (!isReregistration) {
      console.log("Processing image as profile picture");
      
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
      
      console.log('Successfully updated profile image');
    }
    
    // Clear existing registrations to ensure fresh data
    if (isReregistration) {
      const { error: deleteError } = await supabase
        .from('face_registrations')
        .delete()
        .eq('student_id', studentId);
        
      if (deleteError) {
        console.log('Error clearing previous registrations:', deleteError);
        // Continue anyway
      }
    }
    
    // Store multiple copies of the face data for better recognition
    // This replaces the angle-based approach with multiple similar samples
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
      faceDetected: true
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
): Promise<FaceRegistrationResult> {
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
