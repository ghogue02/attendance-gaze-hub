
import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/builder/types';

/**
 * Fetches all builders from the database
 */
export const getBuilders = async (): Promise<Builder[]> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('first_name', { ascending: true });
      
    if (error) {
      console.error('Error fetching builders:', error);
      return [];
    }
    
    // Transform the data into Builder objects
    return data.map(student => ({
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      builderId: student.student_id || '',
      status: 'pending',
      timeRecorded: '',
      image: student.image_url
    }));
    
  } catch (error) {
    console.error('Error fetching builders:', error);
    return [];
  }
};
