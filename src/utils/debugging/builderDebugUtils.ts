
import { supabase } from '@/integrations/supabase/client';
import { clearStudentImageCache, getCachedStudentImage } from '@/utils/cache/studentImageCache';
import { toast } from 'sonner';

/**
 * Debug utility to investigate specific builder issues
 */
export const debugBuilderIssues = async (builderNames: string[]) => {
  console.log(`[BuilderDebug] Investigating issues for builders: ${builderNames.join(', ')}`);
  
  try {
    // Query database for these specific builders
    const { data: builders, error } = await supabase
      .from('students')
      .select('id, first_name, last_name, email, image_url, cohort')
      .or(builderNames.map(name => {
        const [first, last] = name.split(' ');
        return `and(first_name.ilike.${first}%,last_name.ilike.${last}%)`;
      }).join(','));

    if (error) {
      console.error('[BuilderDebug] Database query error:', error);
      return;
    }

    console.log('[BuilderDebug] Builder records found:', builders);

    // Check for any ID conflicts or suspicious patterns
    const ids = builders?.map(b => b.id) || [];
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.warn('[BuilderDebug] DUPLICATE IDs FOUND!', ids);
    }

    // Check image cache for these builders
    builders?.forEach(builder => {
      const fullName = `${builder.first_name} ${builder.last_name}`;
      const cachedImage = getCachedStudentImage(builder.id);
      console.log(`[BuilderDebug] ${fullName} (${builder.id}):`, {
        dbImageUrl: builder.image_url,
        cachedImage,
        cacheMismatch: cachedImage && cachedImage !== builder.image_url
      });
    });

    return builders;
  } catch (error) {
    console.error('[BuilderDebug] Error in debug investigation:', error);
  }
};

/**
 * Clear cache for specific problematic builders
 */
export const clearProblematicBuilderCache = (builderIds: string[]) => {
  console.log(`[BuilderDebug] Clearing cache for builders: ${builderIds.join(', ')}`);
  
  builderIds.forEach(id => {
    clearStudentImageCache(id);
    console.log(`[BuilderDebug] Cleared cache for builder ID: ${id}`);
  });
  
  toast.success(`Cleared cache for ${builderIds.length} builders`);
};

/**
 * Validate builder selection data
 */
export const validateBuilderSelection = (selectedBuilder: any, expectedName: string) => {
  console.log(`[BuilderDebug] Validating builder selection for expected name: ${expectedName}`);
  console.log(`[BuilderDebug] Selected builder data:`, {
    id: selectedBuilder?.id,
    name: selectedBuilder?.name,
    builderId: selectedBuilder?.builderId,
    image: selectedBuilder?.image,
    cohort: selectedBuilder?.cohort
  });
  
  const nameMismatch = selectedBuilder?.name && selectedBuilder.name !== expectedName;
  if (nameMismatch) {
    console.warn(`[BuilderDebug] NAME MISMATCH! Expected: ${expectedName}, Got: ${selectedBuilder.name}`);
    toast.error(`Warning: Selected ${selectedBuilder.name} but expected ${expectedName}`);
    return false;
  }
  
  return true;
};

/**
 * Debug attendance logging for specific builder
 */
export const debugAttendanceLogging = async (builderId: string, builderName: string) => {
  console.log(`[BuilderDebug] Checking attendance records for ${builderName} (${builderId})`);
  
  try {
    const { data: recentAttendance, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', builderId)
      .order('date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[BuilderDebug] Error fetching attendance:', error);
      return;
    }

    console.log(`[BuilderDebug] Recent attendance for ${builderName}:`, recentAttendance);
    
    if (!recentAttendance || recentAttendance.length === 0) {
      console.warn(`[BuilderDebug] NO ATTENDANCE RECORDS found for ${builderName}`);
      toast.warning(`No attendance records found for ${builderName}`);
    }

    return recentAttendance;
  } catch (error) {
    console.error('[BuilderDebug] Error in attendance debugging:', error);
  }
};
