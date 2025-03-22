
import { Builder, BuilderStatus } from '@/components/BuilderCard';
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
        // 2. Compare against stored embeddings for all builders
        // 3. Return the closest match above a confidence threshold
        
        // For demo, we'll use random success/failure with bias toward success
        const successProbability = passive ? 0.85 : 0.7; // Higher success rate in passive mode
        const success = Math.random() < successProbability;
        
        if (success) {
          // Get a random builder from the database
          const { data: buildersData, error } = await supabase
            .from('students')
            .select('*')
            .limit(100);
            
          if (error) {
            console.error('Error fetching builders:', error);
            resolve({
              success: false,
              message: 'Error fetching builder data'
            });
            return;
          }
          
          if (!buildersData || buildersData.length === 0) {
            resolve({
              success: false,
              message: 'No builders found in database'
            });
            return;
          }
          
          // Get a random builder from the results
          const randomIndex = Math.floor(Math.random() * buildersData.length);
          const dbBuilder = buildersData[randomIndex];
          
          // Check if this builder has registered their face
          let registeredCount = 0;
          
          try {
            // Try using the RPC function first
            const { data: countData, error: countError } = await supabase
              .rpc('count_face_registrations', {
                p_student_id: dbBuilder.id
              });
              
            if (countError) {
              console.error('Error with RPC count_face_registrations:', countError);
              // Fall back to direct count
              const { count, error: directCountError } = await supabase
                .from('face_registrations')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', dbBuilder.id);
                
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
          
          // If builder hasn't registered face or not enough angles, return error
          if (registeredCount < 5) {
            resolve({
              success: false,
              message: 'Builder has not completed face registration'
            });
            return;
          }
          
          // Format time for display
          const timeRecorded = new Date().toLocaleTimeString();
          
          // Record attendance in database
          const { error: attendanceError } = await supabase
            .from('attendance')
            .upsert({
              student_id: dbBuilder.id,
              status: 'present',
              time_recorded: new Date().toISOString(),
            }, {
              onConflict: 'student_id,date'
            });
            
          if (attendanceError) {
            console.error('Error recording attendance:', attendanceError);
          }
          
          // Convert database builder to application Builder format
          const builder: Builder = {
            id: dbBuilder.id,
            name: `${dbBuilder.first_name} ${dbBuilder.last_name}`,
            builderId: dbBuilder.student_id || '',
            status: 'present' as BuilderStatus,
            timeRecorded,
            image: dbBuilder.image_url || `https://ui-avatars.com/api/?name=${dbBuilder.first_name}+${dbBuilder.last_name}&background=random`
          };
          
          resolve({
            success: true,
            builder,
            message: 'Builder successfully recognized'
          });
        } else {
          resolve({
            success: false,
            message: 'No matching builder found'
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
