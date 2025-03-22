
import { Builder, BuilderStatus } from '@/components/BuilderCard';
import { supabase } from '@/integrations/supabase/client';
import { RecognitionResult } from './types';

// Function to recognize a face image against registered face data
export const recognizeFace = async (imageData: string, passive = false): Promise<RecognitionResult> => {
  // In a real implementation, this would send the image to your cloud face recognition API
  
  return new Promise((resolve) => {
    // Simulate API delay (shorter for passive mode)
    setTimeout(async () => {
      try {
        console.log("Starting face recognition process...");
        
        // In a production system, we would:
        // 1. Extract face embeddings from the image
        // 2. Compare against stored embeddings for all builders
        // 3. Return the closest match above a confidence threshold
        
        // For this demo version, we'll check if the user has registered their face
        // and return a match if they have
        
        // First, get all students that have completed face registration
        const { data: registeredStudents, error: regError } = await supabase
          .from('face_registrations')
          .select('student_id')
          .order('created_at', { ascending: false });
          
        if (regError) {
          console.error('Error fetching registered students:', regError);
          resolve({
            success: false,
            message: 'Error checking face registrations'
          });
          return;
        }
        
        // Get unique student IDs who have face registrations
        const uniqueStudentIds = [...new Set(registeredStudents?.map(r => r.student_id))];
        console.log(`Found ${uniqueStudentIds.length} students with face registrations`);
        
        if (uniqueStudentIds.length === 0) {
          resolve({
            success: false,
            message: 'No registered faces found in the system'
          });
          return;
        }
        
        // Get the latest registered student (for demo purposes, we'll match them)
        // In a real system, this would be replaced with actual face matching logic
        const latestStudentId = uniqueStudentIds[0];
        
        // Get student details from database
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', latestStudentId)
          .single();
          
        if (studentError || !studentData) {
          console.error('Error fetching student data:', studentError);
          resolve({
            success: false,
            message: 'Error retrieving student information'
          });
          return;
        }
        
        console.log(`Found student: ${studentData.first_name} ${studentData.last_name}`);
        
        // Format time for display
        const timeRecorded = new Date().toLocaleTimeString();
        
        // Record attendance in database
        const { error: attendanceError } = await supabase
          .from('attendance')
          .upsert({
            student_id: studentData.id,
            status: 'present',
            time_recorded: new Date().toISOString(),
          }, {
            onConflict: 'student_id,date'
          });
          
        if (attendanceError) {
          console.error('Error recording attendance:', attendanceError);
        } else {
          console.log('Successfully recorded attendance');
        }
        
        // Convert database student to application Builder format
        const builder: Builder = {
          id: studentData.id,
          name: `${studentData.first_name} ${studentData.last_name}`,
          builderId: studentData.student_id || '',
          status: 'present' as BuilderStatus,
          timeRecorded,
          image: studentData.image_url || `https://ui-avatars.com/api/?name=${studentData.first_name}+${studentData.last_name}&background=random`
        };
        
        resolve({
          success: true,
          builder,
          message: 'Builder successfully recognized'
        });
      } catch (error) {
        console.error('Recognition error:', error);
        resolve({
          success: false,
          message: 'An error occurred during recognition'
        });
      }
    }, passive ? 800 : 1500); // Faster recognition in passive mode
  });
};
