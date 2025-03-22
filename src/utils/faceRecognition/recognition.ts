
import { Student, StudentStatus } from '@/components/StudentCard';
import { supabase } from '@/integrations/supabase/client';
import { RecognitionResult } from './types';

// Function to simulate sending an image to a cloud recognition service
export const recognizeFace = async (imageData: string, passive = false): Promise<RecognitionResult> => {
  // In a real implementation, this would send the image to your cloud face recognition API
  
  return new Promise((resolve) => {
    // Simulate API delay (shorter for passive mode)
    setTimeout(async () => {
      try {
        // In a real implementation, we would:
        // 1. Extract face embeddings from the image
        // 2. Compare against stored embeddings for all students
        // 3. Return the closest match above a confidence threshold
        
        // For demo, we'll use random success/failure with bias toward success
        const successProbability = passive ? 0.85 : 0.7; // Higher success rate in passive mode
        const success = Math.random() < successProbability;
        
        if (success) {
          // Get a random student from the database
          const { data: studentsData, error } = await supabase
            .from('students')
            .select('*')
            .limit(100);
            
          if (error) {
            console.error('Error fetching students:', error);
            resolve({
              success: false,
              message: 'Error fetching student data'
            });
            return;
          }
          
          if (!studentsData || studentsData.length === 0) {
            resolve({
              success: false,
              message: 'No students found in database'
            });
            return;
          }
          
          // Get a random student from the results
          const randomIndex = Math.floor(Math.random() * studentsData.length);
          const dbStudent = studentsData[randomIndex];
          
          // Check if this student has registered their face
          let registeredCount = 0;
          
          try {
            // Try using the RPC function first
            const { data: countData, error: countError } = await supabase
              .rpc('count_face_registrations', {
                p_student_id: dbStudent.id
              });
              
            if (countError) {
              console.error('Error with RPC count_face_registrations:', countError);
              // Fall back to direct count
              const { count, error: directCountError } = await supabase
                .from('face_registrations')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', dbStudent.id);
                
              if (directCountError) {
                console.error('Error with direct count:', directCountError);
              } else {
                registeredCount = count || 0;
              }
            } else {
              registeredCount = countData || 0;
            }
          } catch (e) {
            console.error('Exception during count:', e);
          }
          
          // If student hasn't registered face or not enough angles, return error
          if (registeredCount < 5) {
            resolve({
              success: false,
              message: 'Student has not completed face registration'
            });
            return;
          }
          
          // Format time for display
          const timeRecorded = new Date().toLocaleTimeString();
          
          // Record attendance in database
          const { error: attendanceError } = await supabase
            .from('attendance')
            .upsert({
              student_id: dbStudent.id,
              status: 'present',
              time_recorded: new Date().toISOString(),
            }, {
              onConflict: 'student_id,date'
            });
            
          if (attendanceError) {
            console.error('Error recording attendance:', attendanceError);
          }
          
          // Convert database student to application Student format
          const student: Student = {
            id: dbStudent.id,
            name: `${dbStudent.first_name} ${dbStudent.last_name}`,
            studentId: dbStudent.student_id || '',
            status: 'present' as StudentStatus,
            timeRecorded,
            image: dbStudent.image_url || `https://ui-avatars.com/api/?name=${dbStudent.first_name}+${dbStudent.last_name}&background=random`
          };
          
          resolve({
            success: true,
            student,
            message: 'Student successfully recognized'
          });
        } else {
          resolve({
            success: false,
            message: 'No matching student found'
          });
        }
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
