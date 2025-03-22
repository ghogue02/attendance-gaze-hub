
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
    
    // Be more lenient with face detection for registration
    // Only reject completely if no face is detected in initial capture
    if (!faceDetection.hasFaces && angleIndex === 0 && !isReregistration) {
      console.log(`No face detected in the first image`);
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
    const storageName = `${studentId}_angle${angleIndex}_${Date.now()}.jpg`;
    console.log(`Processing image for angle ${angleIndex}, storage name: ${storageName}`);
    
    // Test if the image is valid
    if (!imageData.startsWith('data:image/')) {
      return {
        success: false,
        message: 'Invalid image format'
      };
    }
    
    // If it's the first angle (front facing) and not re-registering, 
    // use it as the profile image
    if (angleIndex === 0 && !isReregistration) {
      console.log("Processing first angle image as profile picture");
      
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
    
    // Calculate the next angle index - always sequential
    let nextAngleIndex = (angleIndex + 1) % requiredAngles;
    
    // Check if all angles are registered
    const isCompleted = registeredCount >= requiredAngles;
    
    console.log(`Current angle: ${angleIndex}, Next angle: ${nextAngleIndex}, Completed: ${isCompleted}`);
    
    return {
      success: true,
      message: `Angle ${angleIndex + 1} registered successfully`,
      imageCount: registeredCount,
      completed: isCompleted,
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
