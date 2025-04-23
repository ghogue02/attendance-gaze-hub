
import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/builder/types';

export const fetchStudentDetails = async (studentId: string): Promise<Builder | null> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
      
    if (error || !data) {
      console.error('Error fetching student details:', error);
      return null;
    }
    
    return {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      builderId: data.student_id || '',
      status: 'present' as BuilderStatus,
      timeRecorded: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      image: data.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.first_name)}+${encodeURIComponent(data.last_name)}&background=random`
    };
  } catch (error) {
    console.error('Error in fetchStudentDetails:', error);
    return null;
  }
};

export const checkFaceRegistrationStatus = async (studentId: string): Promise<{completed: boolean, count: number}> => {
  try {
    if (!studentId) {
      console.error('Student ID is required');
      return { completed: false, count: 0 };
    }
    
    const { data, error } = await supabase
      .from('face_registrations')
      .select('id')
      .eq('student_id', studentId);
      
    if (error) {
      console.error('Error checking face registration status:', error);
      return { completed: false, count: 0 };
    }
    
    const count = data?.length || 0;
    const completed = count >= 5;
    
    return { completed, count };
  } catch (error) {
    console.error('Error checking face registration status:', error);
    return { completed: false, count: 0 };
  }
};
