
import { supabase } from '@/integrations/supabase/client';

// Clear automated absence notes for students who are present today or excused
export const clearAutomatedNotesForPresentStudents = async (): Promise<number> => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log(`[clearAutomatedNotesForPresentStudents] Clearing automated notes for present/late/excused students on ${today}`);
    
    // Find all records for today that have status 'present', 'late' or 'excused' and have an automated note
    const { data: recordsToUpdate, error: fetchError } = await supabase
      .from('attendance')
      .select('id, notes, status, excuse_reason')
      .eq('date', today)
      .in('status', ['present', 'late', 'excused'])
      .not('notes', 'is', null);
      
    if (fetchError) {
      console.error('Error fetching records to clean notes:', fetchError);
      return 0;
    }
    
    if (!recordsToUpdate || recordsToUpdate.length === 0) {
      console.log('No records found with automated notes that need clearing');
      return 0;
    }
    
    // Filter out only records with automated notes
    const recordsWithAutomatedNotes = recordsToUpdate.filter(record => {
      const notes = record.notes?.toLowerCase() || '';
      return notes.includes('automatically marked') || 
             notes.includes('auto marked') || 
             notes.includes('marked absent by system');
    });
    
    console.log(`Found ${recordsWithAutomatedNotes.length} records with automated notes that need to be cleared`);
    
    if (recordsWithAutomatedNotes.length === 0) {
      return 0;
    }
    
    // Update each record to clear the notes, preserving excuse_reason for excused statuses
    let updatedCount = 0;
    for (const record of recordsWithAutomatedNotes) {
      // For excused status, preserve the excuse_reason in the notes field
      const updateData = record.status === 'excused' 
        ? { 
            notes: record.excuse_reason || null, 
            time_recorded: new Date().toISOString() 
          }
        : { 
            notes: null, 
            time_recorded: new Date().toISOString() 
          };
      
      const { error: updateError } = await supabase
        .from('attendance')
        .update(updateData)
        .eq('id', record.id);
        
      if (updateError) {
        console.error(`Error clearing note for record ${record.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
    
    console.log(`Successfully cleared automated notes for ${updatedCount} records`);
    return updatedCount;
    
  } catch (error) {
    console.error('Error in clearAutomatedNotesForPresentStudents:', error);
    return 0;
  }
};
