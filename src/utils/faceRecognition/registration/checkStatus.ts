
import { supabase } from '@/integrations/supabase/client';

// Function to check if a student has completed face registration
export const checkFaceRegistrationStatus = async (studentId: string): Promise<{completed: boolean, count: number}> => {
  try {
    // Query face registrations directly
    const { data, error } = await supabase
      .from('face_registrations')
      .select('angle_index')
      .eq('student_id', studentId);
      
    if (error) {
      console.error('Error counting registrations:', error);
      return { completed: false, count: 0 };
    }
    
    const registeredAngles = data || [];
    const registeredCount = registeredAngles.length;
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
