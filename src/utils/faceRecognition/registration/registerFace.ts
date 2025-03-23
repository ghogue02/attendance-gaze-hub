
import { supabase } from '@/integrations/supabase/client';
import { FaceRegistrationResult } from '../types';
import { detectFaces } from '../recognitionUtils';
import { updateBuilderAvatar } from './updateAvatar';

// Function to register a face image for a student with simplified approach
export const registerFaceImage = async (
  studentId: string, 
  imageData: string,
  isUpdateMode: boolean = false
): Promise<FaceRegistrationResult> => {
  try {
    console.log(`Starting face registration for student ${studentId}, update mode: ${isUpdateMode}`);
    
    // Validate inputs
    if (!studentId || !imageData) {
      return {
        success: false,
        message: 'Missing required parameters'
      };
    }
    
    // Check if the image contains a face - pass attempt #3 to indicate this is a registration attempt
    // This will make the detection more lenient
    console.log("Calling detectFaces function for face detection...");
    const faceDetection = await detectFaces(imageData, false, 3);
    console.log("Face detection result:", {
      success: faceDetection.success,
      hasFaces: faceDetection.hasFaces,
      confidence: faceDetection.confidence,
      message: faceDetection.message
    });
    
    // If face detection service is unavailable or no face detected, be more tolerant
    // For registration purposes, we'll proceed even if no face is detected
    let faceDetected = true;
    
    if (!faceDetection.success) {
      console.log(`Face detection service unavailable, proceeding with registration anyway`);
      // Continue with registration even if detection failed
    } else if (!faceDetection.hasFaces) {
      console.log(`No face detected in the image, but proceeding with registration for registration robustness`);
      faceDetected = false;
      // We'll still continue with registration - the user has confirmed their face is in the frame
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
    
    // Always update the profile image to ensure consistency
    console.log("Updating profile image");
    const avatarUpdated = await updateBuilderAvatar(studentId, imageData);
    
    if (!avatarUpdated) {
      console.error('Failed to update avatar');
      return {
        success: false,
        message: 'Failed to update profile image'
      };
    }
    
    console.log('Successfully updated profile image');
    
    // Clear existing registrations if in update mode
    if (isUpdateMode) {
      console.log('Update mode enabled, clearing previous registrations');
      const { error: deleteError } = await supabase
        .from('face_registrations')
        .delete()
        .eq('student_id', studentId);
        
      if (deleteError) {
        console.log('Error clearing previous registrations:', deleteError);
        // Continue anyway
      } else {
        console.log('Successfully cleared previous face registrations');
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
    const results = await Promise.allSettled(registrationPromises);
    
    // Check if any registrations failed
    const failedRegistrations = results.filter(r => r.status === 'rejected');
    if (failedRegistrations.length > 0) {
      console.warn(`${failedRegistrations.length} out of 5 registrations failed`);
    }
    
    // As long as at least one registration succeeded, consider it a success
    const anySucceeded = results.some(r => r.status === 'fulfilled' && (r.value as FaceRegistrationResult).success);
    
    if (!anySucceeded) {
      return {
        success: false,
        message: 'Failed to store face registrations'
      };
    }
    
    return {
      success: true,
      message: 'Face registered successfully',
      completed: true,
      faceDetected: faceDetected
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
