
import { supabase } from '@/integrations/supabase/client';

/**
 * Check the face registration status for a specific student
 */
export const checkFaceRegistrationStatus = async (studentId: string): Promise<{
  completed: boolean;
  count: number;
  message?: string;
}> => {
  try {
    // Query to count the number of face registrations for this student
    const { count, error } = await supabase
      .from('face_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId);
      
    if (error) {
      console.error('Error checking face registration status:', error);
      return {
        completed: false,
        count: 0,
        message: 'Failed to check registration status'
      };
    }
    
    const registrationCount = count || 0;
    const isComplete = registrationCount >= 1; // We now consider 1+ photo as complete
    
    return {
      completed: isComplete,
      count: registrationCount,
      message: isComplete 
        ? 'Photo registration complete' 
        : `${registrationCount}/1 photo registered`
    };
  } catch (error) {
    console.error('Exception checking registration status:', error);
    return {
      completed: false,
      count: 0,
      message: 'An error occurred'
    };
  }
};
