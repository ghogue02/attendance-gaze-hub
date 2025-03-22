
import { supabase } from '@/integrations/supabase/client';
import { FaceRegistrationResult } from '../types';
import { detectFaces } from '../recognitionUtils';

// Function to register a face image for a student
export const registerFaceImage = async (
  studentId: string, 
  imageData: string, 
  angleIndex: number,
  isReregistration: boolean = false
): Promise<FaceRegistrationResult> => {
  try {
    console.log(`Starting face registration for student ${studentId}, angle ${angleIndex}`);
    
    // First check if the image actually contains a face
    // For registration, we'll use a higher attempt count to be more lenient
    const faceDetection = await detectFaces(imageData, true, 5);
    if (!faceDetection.success) {
      console.log(`Face detection failed for angle ${angleIndex}`);
      return {
        success: false,
        message: 'Face detection service unavailable. Please try again.',
        faceDetected: false
      };
    }
    
    // For registration, be more lenient with face detection since this is an active
    // user-driven process and the errors are frustrating
    // Allow registration even with lower confidence
    if (!faceDetection.hasFaces && angleIndex > 0) {
      // For angles beyond the first, be more strict
      console.log(`No face detected in the image for angle ${angleIndex}`);
      return {
        success: false,
        message: 'No face detected in the image. Please position your face in the frame.',
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
    
    // Determine if this is the first image (to use as profile pic)
    const isFirstImage = angleIndex === 0;
    
    // Generate a unique storage name including angle index
    const storageName = `${studentId}_angle${angleIndex}_${Date.now()}.jpg`;
    console.log(`Processing image for angle ${angleIndex}, storage name: ${storageName}`);
    
    // Test if the image is valid by checking for the base64 prefix
    if (!imageData.startsWith('data:image/')) {
      return {
        success: false,
        message: 'Invalid image format'
      };
    }
    
    // If it's the first image, use it as the profile image without AI enhancement
    if (isFirstImage) {
      console.log("Processing first angle image as profile picture");
      
      // Update the student's profile image without AI enhancement
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
    
    // Store the face data
    const result = await storeFaceRegistration(studentId, imageData, angleIndex);
    if (!result.success) {
      return result;
    }
    
    // Count registrations for this student
    const { data, error: countError } = await supabase
      .from('face_registrations')
      .select('angle_index')
      .eq('student_id', studentId);
      
    if (countError) {
      console.error('Error counting face registrations:', countError);
      return {
        success: false,
        message: 'Error checking registration status'
      };
    }
    
    const registeredAngles = data || [];
    const registeredCount = registeredAngles.length;
    const requiredAngles = 5; // We require 5 different angle captures
    
    console.log(`Current registration count: ${registeredCount} of ${requiredAngles} required angles`);
    
    // Determine the next angle index
    // Find the next available angle index that hasn't been registered yet
    let nextAngleIndex = 0;
    const registeredAngleIndices = registeredAngles.map(reg => reg.angle_index);
    
    for (let i = 0; i < requiredAngles; i++) {
      if (!registeredAngleIndices.includes(i)) {
        nextAngleIndex = i;
        break;
      }
    }
    
    // When re-registering, we want to go through all angles sequentially
    // regardless of which ones already exist
    if (isReregistration) {
      nextAngleIndex = (angleIndex + 1) % requiredAngles;
      // Only mark as completed when we've gone through all angles
      const isCompleted = angleIndex === requiredAngles - 1;
      
      console.log(`Re-registration: Current angle: ${angleIndex}, Next angle: ${nextAngleIndex}, Completed: ${isCompleted}`);
      
      return {
        success: true,
        message: `Angle ${angleIndex + 1} re-registered successfully`,
        imageCount: registeredCount,
        completed: isCompleted,
        nextAngleIndex,
        faceDetected: true
      };
    }
    
    // If all angles are registered, cycle back to 0
    if (registeredCount >= requiredAngles) {
      nextAngleIndex = (angleIndex + 1) % requiredAngles;
    }
    
    console.log(`Current angle: ${angleIndex}, Next angle: ${nextAngleIndex}, Total registered: ${registeredCount}`);
    
    return {
      success: true,
      message: `Angle ${angleIndex + 1} registered successfully`,
      imageCount: registeredCount,
      completed: registeredCount >= requiredAngles,
      nextAngleIndex,
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
    console.log(`Storing face data for student ${studentId}, angle ${angleIndex}`);
    
    // Delete any existing face registration for this angle and student
    // This ensures we don't have duplicate angles for the same student
    const { error: deleteError } = await supabase
      .from('face_registrations')
      .delete()
      .eq('student_id', studentId)
      .eq('angle_index', angleIndex);
      
    if (deleteError) {
      console.error('Error deleting existing face registration:', deleteError);
    }
    
    // Insert the new face registration
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
