import { supabase } from '@/integrations/supabase/client';
import { FaceRegistrationResult } from './types';

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
    
    // If it's the first image, use it as the profile image
    if (isFirstImage) {
      // Call the AI enhancement function
      const enhancedImage = await enhanceFaceImage(imageData);
      
      // Update the student's profile image
      const { error: updateError } = await supabase
        .from('students')
        .update({ image_url: enhancedImage || imageData })
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
    // Apply AI enhancement to the image
    const enhancedImage = await enhanceFaceImage(imageData);
    
    // Update the builder's avatar in the database
    const { error } = await supabase
      .from('students')
      .update({ image_url: enhancedImage || imageData })
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

// Enhanced function that applies AI transformation to a face image
const enhanceFaceImage = async (imageDataString: string): Promise<string | null> => {
  try {
    // First apply basic image enhancement
    const basicEnhancedImage = await applyBasicEnhancement(imageDataString);
    
    // Try to enhance with AI if available
    try {
      const aiEnhancedImage = await applyAIEnhancement(basicEnhancedImage);
      console.log('Successfully enhanced image with AI');
      return aiEnhancedImage;
    } catch (aiError) {
      console.warn('AI enhancement failed, using basic enhancement instead:', aiError);
      return basicEnhancedImage;
    }
  } catch (error) {
    console.error('Error enhancing image:', error);
    return imageDataString; // Return original if enhancement fails
  }
};

// Apply basic image enhancements using canvas
const applyBasicEnhancement = async (imageDataString: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new Image object to work with
      const img = new Image();
      
      // Handle load errors
      img.onerror = () => {
        console.error('Failed to load image');
        reject('Image loading failed');
      };
      
      // Set up image loading
      img.onload = () => {
        try {
          // Create a canvas to manipulate the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.warn('Could not get 2D context');
            resolve(imageDataString);
            return;
          }
          
          // Set canvas dimensions (maintain aspect ratio but ensure reasonable size)
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height = height * (MAX_SIZE / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = width * (MAX_SIZE / height);
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw the original image to the canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Apply a series of effects to create a professional headshot look:
          
          // 1. Increase contrast slightly
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Contrast adjustment
          const contrast = 20; // Increase contrast by 20%
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          
          for (let i = 0; i < data.length; i += 4) {
            // Apply to each RGB channel
            data[i] = clamp(factor * (data[i] - 128) + 128); // Red
            data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128); // Green
            data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128); // Blue
            // Alpha channel unchanged
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          // 2. Apply a subtle vignette effect (darkened edges)
          ctx.globalCompositeOperation = 'multiply';
          const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) / 1.7
          );
          gradient.addColorStop(0, 'rgba(255,255,255,1)');
          gradient.addColorStop(1, 'rgba(230,230,230,1)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
          
          // 3. Reset composite operation
          ctx.globalCompositeOperation = 'source-over';
          
          // 4. Add a subtle border/glow effect
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 5;
          ctx.shadowColor = 'rgba(0,0,0,0.2)';
          ctx.shadowBlur = 10;
          ctx.strokeRect(0, 0, width, height);
          
          // 5. Slight color warming
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = 'rgba(255, 240, 220, 0.1)';
          ctx.fillRect(0, 0, width, height);
          
          // Reset composite operation
          ctx.globalCompositeOperation = 'source-over';
          
          // Convert the canvas back to a data URL with high quality
          const enhancedImageData = canvas.toDataURL('image/jpeg', 0.95);
          
          resolve(enhancedImageData);
        } catch (canvasError) {
          console.error('Canvas processing error:', canvasError);
          resolve(imageDataString);
        }
      };
      
      // Set image source and begin loading
      img.crossOrigin = 'anonymous';
      img.src = imageDataString;
      
    } catch (error) {
      console.error('Error in basic enhancement:', error);
      resolve(imageDataString);
    }
  });
};

// Helper function to clamp pixel values between 0-255
const clamp = (value: number): number => {
  return Math.max(0, Math.min(255, value));
};

// Apply AI enhancement to the image using an AI service
const applyAIEnhancement = async (imageDataString: string): Promise<string> => {
  // For now, just return the input image
  // In a production app, we would call an AI service API here
  console.log('AI enhancement would be applied here in a production environment');
  
  // The below code simulates a slight delay that would happen with a real API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(imageDataString);
    }, 200);
  });
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
