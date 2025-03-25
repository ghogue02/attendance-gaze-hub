
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Update the profile image for a builder/student
 * This function uploads the image to Supabase storage bucket
 * and saves the URL reference to both the students table
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
      toast.error('Student ID is required');
      return false;
    }
    
    if (!imageData || !imageData.startsWith('data:image/')) {
      console.error('Invalid image data format');
      toast.error('Invalid image format');
      return false;
    }
    
    // First, verify the student exists
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('id, first_name, last_name, email, student_id')
      .eq('id', studentId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching student:', fetchError);
      toast.error(`Database error: ${fetchError.message}`);
      return false;
    }
    
    if (!student) {
      console.error('Student not found');
      toast.error('Student record not found');
      return false;
    }
    
    console.log('Found student record:', student.first_name, student.last_name);
    
    // Convert base64 to blob for storage upload
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.split(';')[0].split(':')[1];
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    
    const blob = new Blob(byteArrays, { type: mimeType });
    
    // Upload to Supabase Storage
    const filename = `avatar-${studentId}-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;
    console.log(`Uploading image to avatars/${filename}`);
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(filename, blob, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      toast.error(`Failed to upload image: ${uploadError.message}`);
      return false;
    }
    
    console.log('Image uploaded successfully:', uploadData?.path);
    
    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filename);
      
    console.log('Public URL:', publicUrl);
    
    // Update the student record with the image URL
    const updateResult = await supabase
      .from('students')
      .update({
        image_url: publicUrl,
        last_face_update: new Date().toISOString()
      })
      .eq('id', studentId)
      .select();
      
    if (updateResult.error) {
      console.error('Error updating student image:', updateResult.error);
      toast.error(`Failed to update image: ${updateResult.error.message}`);
      return false;
    }
    
    if (!updateResult.data || updateResult.data.length === 0) {
      console.error('No rows were updated in students table');
      
      // Try again with upsert as a fallback, but include all required fields
      const upsertResult = await supabase
        .from('students')
        .upsert({
          id: studentId,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          image_url: publicUrl,
          last_face_update: new Date().toISOString(),
          student_id: student.student_id
        }, { onConflict: 'id' })
        .select();
        
      if (upsertResult.error || !upsertResult.data || upsertResult.data.length === 0) {
        console.error('Error in fallback upsert:', upsertResult.error || 'No data returned');
        toast.error('Failed to update profile image');
        return false;
      }
      
      console.log('Profile updated via fallback upsert');
    } else {
      console.log('Student image updated successfully:', updateResult.data[0].id);
    }
    
    // Also store the original image data for face recognition in face_registrations
    const { error: faceRegError } = await supabase
      .from('face_registrations')
      .upsert({
        student_id: studentId,
        face_data: imageData, // Keep the original image data for face recognition
        angle_index: 0
      }, {
        onConflict: 'student_id,angle_index'
      });
      
    if (faceRegError) {
      console.error('Error updating face registration:', faceRegError);
      // Continue anyway as the profile was updated
      console.log('Face registration failed but profile was updated');
    } else {
      console.log('Face registration created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateBuilderAvatar:', error);
    toast.error('An unexpected error occurred');
    return false;
  }
};
