
import { supabase } from '@/integrations/supabase/client';
import { FaceRegistrationResult } from './types';
import { enhanceFaceImage, initRunwareService } from './aiEnhancement';

// Function to register a face image for a student
export const registerFaceImage = async (
  studentId: string, 
  imageData: string, 
  angleIndex: number
): Promise<FaceRegistrationResult> => {
  try {
    // In a real implementation, this would:
    // 1. Extract face embeddings from the image
    // 2. Store them in a database linked to the student
    
    // For this demo, we'll simply update the student record
    // In a real implementation, we'd store multiple face embeddings
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
    
    // If it's the first image, use it as the profile image
    if (isFirstImage) {
      console.log("Processing first angle image as profile picture");
      
      // Call the AI enhancement function
      const enhancedImage = await enhanceFaceImage(imageData);
      console.log("Enhanced image received:", enhancedImage ? "Success" : "Failed");
      
      // Update the student's profile image
      const { error: updateError } = await supabase
        .from('students')
        .update({ 
          image_url: enhancedImage || imageData,
          last_face_update: new Date().toISOString() // Now this column exists in the database
        })
        .eq('id', studentId);
        
      if (updateError) {
        console.error('Error updating student image:', updateError);
        return {
          success: false,
          message: 'Failed to save face image'
        };
      }
      
      console.log('Successfully updated profile image with enhanced version');
    }
    
    // Store the face data directly in the database
    try {
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
          face_data: imageData,
          angle_index: angleIndex
        });
        
      if (insertError) {
        console.error('Error inserting face registration:', insertError);
        return {
          success: false,
          message: 'Failed to register face data'
        };
      }
    } catch (e) {
      console.error('Exception during face registration:', e);
      return {
        success: false,
        message: 'Exception during face registration'
      };
    }
    
    // Count registrations for this student
    const { count, error: countError } = await supabase
      .from('face_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId);
      
    if (countError) {
      console.error('Error counting face registrations:', countError);
      return {
        success: false,
        message: 'Error checking registration status'
      };
    }
    
    const registeredCount = count || 0;
    const requiredAngles = 5; // We require 5 different angle captures
    const nextAngleIndex = angleIndex + 1 >= requiredAngles ? 0 : angleIndex + 1;
    
    return {
      success: true,
      message: `Angle ${angleIndex + 1} registered successfully`,
      imageCount: registeredCount,
      completed: registeredCount >= requiredAngles,
      nextAngleIndex
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'An error occurred during face registration'
    };
  }
};

// Function to update a builder's avatar with a captured face image
export const updateBuilderAvatar = async (builderId: string, imageData: string): Promise<boolean> => {
  try {
    console.log("Starting builder avatar update process");
    
    // Apply AI enhancement to the image
    const enhancedImage = await enhanceFaceImage(imageData);
    console.log("Enhanced avatar image received:", enhancedImage ? "Success" : "Failed");
    
    if (!enhancedImage) {
      console.log("No enhanced image returned, using original");
    }
    
    // Update the builder's avatar in the database
    const { error } = await supabase
      .from('students')
      .update({ 
        image_url: enhancedImage || imageData,
        last_face_update: new Date().toISOString() // Now this column exists in the database
      })
      .eq('id', builderId);
    
    if (error) {
      console.error('Error updating avatar:', error);
      return false;
    }
    
    console.log('Successfully updated avatar with enhanced image');
    return true;
  } catch (error) {
    console.error('Error updating avatar:', error);
    return false;
  }
};

// Function to check if a student has completed face registration
export const checkFaceRegistrationStatus = async (studentId: string): Promise<{completed: boolean, count: number}> => {
  try {
    // Query face registrations directly
    const { count, error } = await supabase
      .from('face_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId);
      
    if (error) {
      console.error('Error counting registrations:', error);
      return { completed: false, count: 0 };
    }
    
    const registeredCount = count || 0;
    const requiredAngles = 5; // We require 5 different angle captures
    
    return {
      completed: registeredCount >= requiredAngles,
      count: registeredCount
    };
  } catch (error) {
    console.error('Error in checkFaceRegistrationStatus:', error);
    return { completed: false, count: 0 };
  }
};

// Initialize Runware service if API key is available
// For production, this would be retrieved from environment variables or secure storage
export const setupAIService = (apiKey: string): void => {
  if (!apiKey) {
    console.warn('No API key provided for AI service. Enhanced avatar generation will not be available.');
    return;
  }
  
  initRunwareService(apiKey);
  console.log('AI service initialized for enhanced avatar generation');
};
