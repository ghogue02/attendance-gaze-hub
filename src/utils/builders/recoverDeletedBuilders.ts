
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

    // First, get ALL attendance records with student_ids 
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, notes, created_at, date')
      .not('student_id', 'is', null);

    if (attendanceError) {
      console.error('Error fetching attendance data:', attendanceError);
      toast.error('Failed to fetch attendance data');
      return 0;
    }

    console.log(`Found ${attendanceData?.length || 0} total attendance records with student IDs`);

    // Get all current students for comparison (including archived ones)
    const { data: allStudents, error: studentsError } = await supabase
      .from('students')
      .select('id');

    if (studentsError) {
      console.error('Error fetching current students:', studentsError);
      toast.error('Failed to fetch current students');
      return 0;
    }

    console.log(`Found ${allStudents?.length || 0} total students (active + archived) in database`);

    // Create a Set of all student IDs for faster lookup
    const allStudentIds = new Set<string>(allStudents.map(s => s.id));

    // Extract unique student IDs from attendance that don't exist in students table AT ALL
    const deletedStudentIds = new Set<string>();
    const attendanceIdMap = new Map<string, {
      count: number,
      dates: string[],
      notes: string[]
    }>();

    // First pass - identify missing IDs and collect information about them
    attendanceData.forEach(record => {
      const studentId = record.student_id as string;
      if (studentId && !allStudentIds.has(studentId)) {
        // This is a deleted student - their ID exists in attendance but not in students table
        deletedStudentIds.add(studentId);
        
        // Track attendance info for this deleted student
        if (!attendanceIdMap.has(studentId)) {
          attendanceIdMap.set(studentId, { 
            count: 0, 
            dates: [], 
            notes: []
          });
        }
        
        const info = attendanceIdMap.get(studentId)!;
        info.count++;
        
        if (record.date && !info.dates.includes(record.date)) {
          info.dates.push(record.date);
        }
        
        if (record.notes && !info.notes.includes(record.notes)) {
          info.notes.push(record.notes);
        }
      }
    });

    console.log(`Found ${deletedStudentIds.size} student IDs that exist in attendance but not in students table`);
    
    if (deletedStudentIds.size === 0) {
      toast.info('No deleted builders found to recover');
      return 0;
    }

    // Convert to array for processing
    const deletedIds = Array.from(deletedStudentIds);
    console.log(`Processing ${deletedIds.length} deleted builder IDs`);

    // Track recovery results
    let recoveredCount = 0;
    const skippedIds: string[] = [];

    // Process each deleted ID
    for (const studentId of deletedIds) {
      const attendanceInfo = attendanceIdMap.get(studentId);
      if (!attendanceInfo) continue;
      
      // Try to extract name from notes (often formatted as "First Last - Other info")
      let firstName = 'Recovered';
      let lastName = `Builder-${studentId.substring(0, 6)}`;
      let nameExtracted = false;
      
      // Try all notes to find a name
      for (const note of attendanceInfo.notes) {
        if (!note) continue;
        
        // Try to extract name from "Name - Info" format
        const dashIndex = note.indexOf(' - ');
        if (dashIndex > 0) {
          const possibleName = note.substring(0, dashIndex).trim();
          const nameParts = possibleName.split(' ');
          
          // Basic validation - name should have at least 2 parts and not be "Recovered Builder"
          if (nameParts.length >= 2 && possibleName !== 'Recovered Builder') {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
            nameExtracted = true;
            break;
          }
        }
      }
      
      console.log(`Attempting to recover builder: ${firstName} ${lastName} (${studentId})`);
      
      // Check if this builder already exists
      const { data: existingBuilder } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .maybeSingle();
        
      if (existingBuilder) {
        console.log(`Builder ${studentId} already exists in the database, skipping`);
        skippedIds.push(studentId);
        continue;
      }
      
      // Calculate last seen date from available attendance dates
      let lastSeenDate = 'Unknown';
      if (attendanceInfo.dates.length > 0) {
        const datesToCompare = attendanceInfo.dates
          .map(d => new Date(d))
          .filter(d => !isNaN(d.getTime()));
        
        if (datesToCompare.length > 0) {
          const latestDate = new Date(Math.max(...datesToCompare.map(d => d.getTime())));
          lastSeenDate = latestDate.toLocaleDateString();
        }
      }
      
      // Create archived record
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          id: studentId,
          first_name: firstName,
          last_name: lastName,
          email: `recovered-${studentId.substring(0, 8)}@example.com`,
          archived_at: new Date().toISOString(),
          archived_reason: `Recovered deleted builder. Appeared in ${attendanceInfo.count} attendance records. Last seen: ${lastSeenDate}`
        });

      if (!insertError) {
        recoveredCount++;
        console.log(`Successfully recovered builder: ${firstName} ${lastName}`);
      } else {
        console.error(`Error recovering builder ${studentId}:`, insertError);
        skippedIds.push(studentId);
      }
    }

    console.log(`Recovery process complete. Recovered ${recoveredCount} builders. Skipped ${skippedIds.length}.`);
    if (recoveredCount > 0) {
      toast.success(`Recovered ${recoveredCount} previously deleted builders`);
    } else {
      toast.info('No builders were recovered');
    }
    
    return recoveredCount;
  } catch (error) {
    console.error('Error during builder recovery process:', error);
    toast.error('An error occurred during builder recovery');
    return 0;
  }
};
