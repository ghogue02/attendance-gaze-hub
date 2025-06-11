
import { supabase } from '@/integrations/supabase/client';
import { Cohort } from '@/types/cohort';

export const getCohorts = async (): Promise<Cohort[]> => {
  try {
    const { data, error } = await supabase
      .from('cohorts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching cohorts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCohorts:', error);
    return [];
  }
};

export const getStudentsByCohort = async (cohortName?: string) => {
  try {
    let query = supabase
      .from('students')
      .select('*')
      .is('archived_at', null)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (cohortName && cohortName !== 'All Cohorts') {
      query = query.eq('cohort', cohortName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching students by cohort:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getStudentsByCohort:', error);
    return [];
  }
};
