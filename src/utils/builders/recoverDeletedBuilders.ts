
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Recovers previously deleted builders by examining attendance records
 * and creating placeholder archived records for them
 * @returns The number of recovered builders
 */
export const recoverDeletedBuilders = async (): Promise<number> => {
  try {
    console.log('Attempting to recover previously deleted builders');

    // First, get all attendance records that have student_ids
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id')
      .not('student_id', 'is', null);

    if (attendanceError) {
      console.error('Error fetching attendance data:', attendanceError);
      return 0;
    }

    // Extract unique student IDs
    const studentIds = [...new Set(attendanceData.map(record => record.student_id))];
    console.log(`Found ${studentIds.length} unique student IDs in attendance records`);

    // Check which of these students don't exist in the students table
    let recoveredCount = 0;
    for (const studentId of studentIds) {
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .maybeSingle();

      if (!existingStudent) {
        // This student exists in attendance records but not in students table - create a placeholder
        console.log(`Creating placeholder for deleted student ID: ${studentId}`);
        
        // First check if there's any additional info we can recover from attendance records
        const { data: attendanceInfo } = await supabase
          .from('attendance')
          .select('notes')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        const builderName = attendanceInfo?.notes ? 
          attendanceInfo.notes.split(' - ')[0] : 'Recovered Builder';
        
        // Try to extract first and last name from notes if possible
        let firstName = 'Recovered';
        let lastName = 'Builder';
        
        if (builderName && builderName !== 'Recovered Builder') {
          const nameParts = builderName.split(' ');
          if (nameParts.length >= 1) firstName = nameParts[0];
          if (nameParts.length >= 2) lastName = nameParts.slice(1).join(' ');
        }
        
        const { error: insertError } = await supabase
          .from('students')
          .insert({
            id: studentId,
            first_name: firstName,
            last_name: lastName,
            email: `recovered-${studentId}@example.com`, // Placeholder email
            archived_at: new Date().toISOString(),
            archived_reason: 'Recovered from deleted status'
          });

        if (!insertError) {
          recoveredCount++;
        } else {
          console.error(`Error recovering builder ${studentId}:`, insertError);
        }
      }
    }

    console.log(`Recovery process complete. Recovered ${recoveredCount} builders`);
    if (recoveredCount > 0) {
      toast.success(`Recovered ${recoveredCount} previously deleted builders`);
    }
    
    return recoveredCount;
  } catch (error) {
    console.error('Error during builder recovery process:', error);
    return 0;
  }
};
