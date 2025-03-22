
import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/BuilderCard';

// Function to get all builders
export const getAllBuilders = async (): Promise<Builder[]> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('first_name', { ascending: true });
      
    if (error) {
      console.error('Error fetching builders:', error);
      return [];
    }
    
    return data.map(student => ({
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      builderId: student.student_id || '',
      imageUrl: student.image_url || '',
      status: 'pending' as BuilderStatus,
      timeRecorded: ''
    }));
  } catch (error) {
    console.error('Error in getAllBuilders:', error);
    return [];
  }
};

// Function to mark attendance
export const markAttendance = async (
  builderId: string, 
  status: BuilderStatus, 
  excuseReason?: string
): Promise<boolean> => {
  try {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    
    const { error } = await supabase
      .from('attendance')
      .insert({
        student_id: builderId,
        status: status,
        date: date,
        time_recorded: time,
        excuse_reason: excuseReason
      });
    
    if (error) {
      console.error('Error marking attendance:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in markAttendance:', error);
    return false;
  }
};
