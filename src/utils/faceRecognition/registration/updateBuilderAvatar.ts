
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Update the profile image for a builder/student
 * This function saves the image to both the students table
 * and creates face registration data
 */
export const updateBuilderAvatar = async (
  studentId: string,
  imageData: string
): Promise<boolean> => {
  try {
    console.log(`Starting avatar update for student ${studentId}`);
    
    if (!studentId) {
      console.error('Student ID is required');
      return false;
    }
    
    if (!imageData || !imageData.startsWith('data:image/')) {
      console.error('Invalid image data format');
      return false;
    }
    
    // First, fetch the student record to verify it exists
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .eq('id', studentId)
      .single();
      
    if (fetchError || !student) {
      console.error('Error fetching student:', fetchError || 'Student not found');
      return false;
    }
    
    console.log('Found student record:', student.first_name, student.last_name);
    
    // Update the student record with the image data - using update() instead of upsert()
    const { data, error } = await supabase
      .from('students')
      .update({ 
        image_url: imageData,
        last_face_update: new Date().toISOString()
      })
      .eq('id', studentId)
      .select();
      
    if (error) {
      console.error('Error updating student image:', error);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.error('No rows were updated in students table');
      return false;
    }
    
    console.log('Student image updated successfully:', data[0].id);
    
    // Now update the face registration
    const { error: faceRegError } = await supabase
      .from('face_registrations')
      .insert({
        student_id: studentId,
        face_data: imageData,
        angle_index: 0
      });
      
    if (faceRegError) {
      console.error('Error updating face registration:', faceRegError);
      // Continue anyway as the profile was updated
    } else {
      console.log('Face registration created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateBuilderAvatar:', error);
    return false;
  }
};
