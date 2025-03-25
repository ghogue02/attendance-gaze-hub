
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AttendanceRecord {
  firstName: string;
  lastName: string;
  date: string;
  status: 'present' | 'absent';
}

/**
 * Imports historical attendance data into the database
 * @param records Array of attendance records to import
 * @returns Promise with the result of the import operation
 */
export const importHistoricalAttendance = async (records: AttendanceRecord[]): Promise<boolean> => {
  try {
    console.log(`Starting import of ${records.length} historical attendance records`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Get all students to match by name
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, last_name');
      
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      toast.error('Failed to fetch student data for attendance import');
      return false;
    }
    
    if (!students || students.length === 0) {
      console.error('No students found in the database');
      toast.error('No students found for attendance import');
      return false;
    }
    
    console.log(`Found ${students.length} students in the database`);
    
    // Create a map for easy lookup
    const studentMap = new Map();
    
    students.forEach(student => {
      const fullName = `${student.first_name.toLowerCase()} ${student.last_name.toLowerCase()}`;
      studentMap.set(fullName, student.id);
    });
    
    // Process records in batches to avoid overwhelming the database
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    
    // Process each batch
    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} records)`);
      
      const recordsToInsert = [];
      
      for (const record of batch) {
        // Find the student ID by name
        const fullName = `${record.firstName.toLowerCase()} ${record.lastName.toLowerCase()}`;
        const studentId = studentMap.get(fullName);
        
        if (!studentId) {
          console.warn(`No matching student found for: ${record.firstName} ${record.lastName}`);
          failCount++;
          continue;
        }
        
        // Parse date from MM/DD format to YYYY-MM-DD format
        const [month, day] = record.date.split('/');
        const year = 2024; // Assuming all records are from 2024
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        // Check if attendance record already exists for this date
        const { data: existingRecord, error: checkError } = await supabase
          .from('attendance')
          .select('id')
          .eq('student_id', studentId)
          .eq('date', formattedDate)
          .maybeSingle();
          
        if (checkError) {
          console.error(`Error checking existing record for ${record.firstName} ${record.lastName} on ${formattedDate}:`, checkError);
          failCount++;
          continue;
        }
        
        if (existingRecord) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('attendance')
            .update({
              status: record.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRecord.id);
            
          if (updateError) {
            console.error(`Error updating record for ${record.firstName} ${record.lastName} on ${formattedDate}:`, updateError);
            failCount++;
          } else {
            successCount++;
          }
        } else {
          // Add to records to insert
          recordsToInsert.push({
            student_id: studentId,
            date: formattedDate,
            status: record.status,
            time_recorded: new Date().toISOString()
          });
        }
      }
      
      // Bulk insert new records
      if (recordsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('attendance')
          .insert(recordsToInsert);
          
        if (insertError) {
          console.error('Error inserting batch of records:', insertError);
          failCount += recordsToInsert.length;
        } else {
          successCount += recordsToInsert.length;
        }
      }
    }
    
    console.log(`Import completed: ${successCount} records imported successfully, ${failCount} failures`);
    
    if (failCount > 0) {
      toast.warning(`Imported ${successCount} records with ${failCount} failures`);
    } else {
      toast.success(`Successfully imported ${successCount} attendance records`);
    }
    
    return true;
  } catch (error) {
    console.error('Error in importHistoricalAttendance:', error);
    toast.error('An unexpected error occurred during attendance import');
    return false;
  }
};

/**
 * Helper function to parse attendance data in the format:
 * firstName lastName date(MM/DD) status(Yes/No)
 */
export const parseAttendanceData = (rawData: string): AttendanceRecord[] => {
  const lines = rawData.trim().split('\n');
  const records: AttendanceRecord[] = [];
  
  for (const line of lines) {
    const parts = line.split('\t');
    
    if (parts.length >= 4) {
      const firstName = parts[0].trim();
      const lastName = parts[1].trim();
      const date = parts[2].trim();
      const isPresent = parts[3].trim().toLowerCase() === 'yes';
      
      records.push({
        firstName,
        lastName,
        date,
        status: isPresent ? 'present' : 'absent'
      });
    }
  }
  
  return records;
};
