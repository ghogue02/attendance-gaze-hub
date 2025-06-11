
import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/builder/types';

// Cache for builder data
const buildersCache = {
  data: [] as Builder[],
  timestamp: 0,
  ttl: 10 * 60 * 1000 // 10 minutes cache TTL
};

/**
 * Validates that a string is a proper BuilderStatus type
 */
const validateBuilderStatus = (status: string | null): BuilderStatus => {
  if (!status) return 'pending';
  if (['present', 'absent', 'excused', 'pending', 'late'].includes(status)) {
    return status as BuilderStatus;
  }
  return 'pending';
};

/**
 * Fetches all active (non-archived) builders from the database with caching
 */
export const getBuilders = async (cohort?: string): Promise<Builder[]> => {
  try {
    // Check cache first - only if no specific cohort requested
    const now = Date.now();
    if (!cohort && buildersCache.data.length > 0 && (now - buildersCache.timestamp) < buildersCache.ttl) {
      console.log('Using cached builders data');
      return buildersCache.data;
    }
    
    console.log('Fetching fresh builders data', cohort ? `for cohort: ${cohort}` : '');
    
    let query = supabase
      .from('students')
      .select('*')
      .is('archived_at', null) // Only fetch non-archived builders
      .order('first_name', { ascending: true });

    // Add cohort filter if specified and not "All Cohorts"
    if (cohort && cohort !== 'All Cohorts') {
      query = query.eq('cohort', cohort);
    }

    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching builders:', error);
      return [];
    }
    
    // Transform the data into Builder objects
    const builders: Builder[] = data.map(student => ({
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      builderId: student.email || '', // Changed to use email instead of student_id
      status: validateBuilderStatus('pending'),
      timeRecorded: '',
      image: student.image_url,
      cohort: student.cohort // Include cohort information
    }));
    
    // Update cache only if fetching all builders
    if (!cohort || cohort === 'All Cohorts') {
      buildersCache.data = builders;
      buildersCache.timestamp = now;
    }
    
    return builders;
  } catch (error) {
    console.error('Error fetching builders:', error);
    return [];
  }
};

// Function to clear the cache
export const clearBuildersCache = () => {
  console.log('Clearing builders cache');
  buildersCache.data = [];
  buildersCache.timestamp = 0;
};
