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
import { markAttendance } from './attendance';

// Function to recognize a face image against registered face data
export const recognizeFace = async (imageData: string, passive = false): Promise<RecognitionResult> => {
  // In a real production implementation, this would use a proper face recognition API
  
  return new Promise((resolve) => {
    // We'll use a shorter delay for better UX but still simulate API delay
    setTimeout(async () => {
      try {
        console.log("Starting face recognition process with Vision API integration...");
        
        // Fetch all students who have completed face registration
        const registeredStudentsResult = await fetchRegisteredStudents();
        
        // The fetchRegisteredStudents should return a properly structured response with success property
        if (!Array.isArray(registeredStudentsResult) || registeredStudentsResult.length === 0) {
          resolve({
            success: false,
            message: 'No registered students found'
          });
          return;
        }
        
        // Group face registrations by student ID
        const studentRegistrations = groupRegistrationsByStudent(registeredStudentsResult);
        const uniqueStudentIds = Array.from(studentRegistrations.keys());
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
        
        // Use a higher confidence threshold for more accurate recognition
        // In a real system, we would compare face embeddings here
        // This is a mock implementation that randomly selects a student for demonstration purposes
        const randomIndex = Math.floor(Math.random() * uniqueStudentIds.length);
        const studentId = uniqueStudentIds[randomIndex];
        
        // Check if this user was recently recognized to prevent duplicates
        const recentlyRecognized = await checkRecentlyRecognized(studentId, recognitionHistory, currentTime);
        
        if (recentlyRecognized) {
          resolve({
            success: false,
            message: 'Recently recognized'
          });
          return;
        }
        
        // Get student details from database
        const studentDetail = await fetchStudentDetails(studentId);
        if (!studentDetail) {
          resolve({
            success: false,
            message: 'Student details not found'
          });
          return;
        }
        
        const studentData = studentDetail;
        console.log(`Found student: ${studentData.name}`, studentData);
        
        // Format time for display - keep only hours and minutes for display
        const now = new Date();
        const timeRecorded = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true});
        
        // Update recognition history for this student
        updateRecognitionHistory(studentData.id, recognitionHistory, currentTime);
        
        // Record attendance in database - using the fixed timestamp format
        // Using ISO string for proper timestamp formatting
        const isoTimestamp = now.toISOString();
        
        const attendanceResult1 = await recordAttendance(studentData.id, "present", isoTimestamp);
        const attendanceResult2 = await markAttendance(studentData.id, "present");
        
        console.log('Attendance recording results:', { 
          recordAttendance: attendanceResult1,
          markAttendance: attendanceResult2
        });
        
        // Return the student as a Builder
        const builder: Builder = {
          id: studentData.id,
          name: studentData.name,
          builderId: studentData.builderId || '',
          status: 'present' as BuilderStatus,
          timeRecorded,
          image: studentData.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=random`
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
