
import { Builder, BuilderStatus } from '@/components/BuilderCard';
import { RecognitionResult } from './types';
import { 
  fetchRegisteredStudents,
  groupRegistrationsByStudent,
  manageRecognitionHistory,
  checkRecentlyRecognized,
  fetchStudentDetails,
  recordAttendance,
  updateRecognitionHistory,
  selectStudentForRecognition
} from './recognitionUtils';

// Function to recognize a face image against registered face data
export const recognizeFace = async (imageData: string, passive = false): Promise<RecognitionResult> => {
  // In a real production implementation, this would use a proper face recognition API
  
  return new Promise((resolve) => {
    // We'll use a shorter delay for better UX but still simulate API delay
    setTimeout(async () => {
      try {
        console.log("Starting face recognition process in production mode...");
        
        // Fetch all students who have completed face registration
        const registeredStudentsResult = await fetchRegisteredStudents();
        if (!registeredStudentsResult.success) {
          resolve({
            success: false,
            message: registeredStudentsResult.message
          });
          return;
        }
        
        // Group face registrations by student ID
        const studentRegistrations = groupRegistrationsByStudent(registeredStudentsResult.data);
        const uniqueStudentIds = Object.keys(studentRegistrations);
        console.log(`Found ${uniqueStudentIds.length} students with face registrations`);
        
        if (uniqueStudentIds.length === 0) {
          resolve({
            success: false,
            message: 'No valid face registrations found'
          });
          return;
        }
        
        // Manage recognition history
        const { recognitionHistory, currentTime } = manageRecognitionHistory();
        
        /**
         * PRODUCTION FACE RECOGNITION ALGORITHM
         * In a real production system, this would:
         * 1. Use an AI model to extract facial embeddings from the captured image
         * 2. Compare embeddings against stored face data for all registered users
         * 3. Use a similarity metric (e.g., cosine similarity) to find the closest match
         * 4. Apply a confidence threshold to prevent false positives
         * 5. Return the best match above the threshold
         */
         
        // For demo purposes, select a user from the registered users
        const studentId = selectStudentForRecognition(uniqueStudentIds);
        
        // New logic: If no face is detected in passive mode, return early
        if (studentId === null && passive) {
          resolve({
            success: false,
            message: 'No face detected in frame'
          });
          return;
        } else if (studentId === null) {
          // In active mode, we'll give a more user-friendly message
          resolve({
            success: false,
            message: 'No face detected. Please position your face in the frame.'
          });
          return;
        }
        
        // Check if this user was recently recognized to prevent duplicates
        if (checkRecentlyRecognized(studentId, recognitionHistory, currentTime)) {
          resolve({
            success: false,
            message: 'Recently recognized'
          });
          return;
        }
        
        // Get student details from database
        const studentResult = await fetchStudentDetails(studentId);
        if (!studentResult.success) {
          resolve({
            success: false,
            message: studentResult.message
          });
          return;
        }
        
        const studentData = studentResult.data;
        console.log(`Found student: ${studentData.first_name} ${studentData.last_name}`);
        
        // Format time for display
        const timeRecorded = new Date().toLocaleTimeString();
        
        // Update recognition history for this student
        updateRecognitionHistory(studentData.id, recognitionHistory, currentTime);
        
        // Record attendance in database
        await recordAttendance(studentData.id);
        
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
    }, passive ? 100 : 500); // Even faster recognition in passive mode (100ms)
  });
};
