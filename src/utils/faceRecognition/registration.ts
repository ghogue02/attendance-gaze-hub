
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
      
      // Try using the RPC function first
      const { error: registrationError } = await supabase
        .rpc('insert_face_registration', {
          p_student_id: studentId,
          p_face_data: imageData,
          p_angle_index: angleIndex
        });
        
      if (registrationError) {
        console.error('Error with RPC insert_face_registration:', registrationError);
        // Fall back to direct insert
        const { error: insertError } = await supabase
          .from('face_registrations')
          .insert({
            student_id: studentId,
            face_data: imageData,
            angle_index: angleIndex
          });
          
        if (insertError) {
          console.error('Error with direct insert:', insertError);
          return {
            success: false,
            message: 'Failed to register face data'
          };
        }
      }
    } catch (e) {
      console.error('Exception during face registration:', e);
      return {
        success: false,
        message: 'Exception during face registration'
      };
    }
    
    // Count registrations for this student
    let registeredCount = 0;
    
    try {
      // Try using the RPC function first
      const { data: countData, error: countError } = await supabase
        .rpc('count_face_registrations', {
          p_student_id: studentId
        });
        
      if (countError) {
        console.error('Error with RPC count_face_registrations:', countError);
        // Fall back to direct count
        const { count, error: directCountError } = await supabase
          .from('face_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId);
          
        if (directCountError) {
          console.error('Error with direct count:', directCountError);
        } else {
          registeredCount = count || 0;
        }
      } else {
        registeredCount = countData || 0;
      }
    } catch (e) {
      console.error('Exception during count:', e);
    }
    
    const requiredAngles = 5; // We require 5 different angle captures
    
    return {
      success: true,
      message: `Angle ${angleIndex + 1} registered successfully`,
      imageCount: registeredCount,
      completed: registeredCount >= requiredAngles
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
    let registeredCount = 0;
    
    try {
      // Try with RPC first
      const { data: countData, error: countError } = await supabase
        .rpc('count_face_registrations', {
          p_student_id: studentId
        });
        
      if (countError) {
        console.error('Error with RPC count_face_registrations:', countError);
        // Fallback to direct query
        const { count, error: directCountError } = await supabase
          .from('face_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId);
          
        if (directCountError) {
          console.error('Error counting registrations:', directCountError);
        } else {
          registeredCount = count || 0;
        }
      } else {
        registeredCount = countData || 0;
      }
    } catch (e) {
      console.error('Exception during count:', e);
    }
    
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
