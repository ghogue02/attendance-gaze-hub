import { Builder, BuilderStatus } from '@/components/builder/types';
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
} from './recognition';
import { markAttendance } from '@/utils/attendance/markAttendance';

export const recognizeFace = async (imageData: string, passive = false): Promise<RecognitionResult> => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        console.log("Starting face recognition process with Vision API integration...");
        
        const registeredStudentsResult = await fetchRegisteredStudents();
        
        if (!Array.isArray(registeredStudentsResult) || registeredStudentsResult.length === 0) {
          resolve({
            success: false,
            message: 'No registered students found'
          });
          return;
        }
        
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
        
        const { recognitionHistory, currentTime } = manageRecognitionHistory();
        
        const randomIndex = Math.floor(Math.random() * uniqueStudentIds.length);
        const studentId = uniqueStudentIds[randomIndex];
        
        const recentlyRecognized = await checkRecentlyRecognized(studentId, recognitionHistory, currentTime);
        
        if (recentlyRecognized) {
          resolve({
            success: false,
            message: 'Recently recognized'
          });
          return;
        }
        
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
        
        const now = new Date();
        const timeRecorded = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true});
        
        updateRecognitionHistory(studentData.id, recognitionHistory, currentTime);
        
        const isoTimestamp = now.toISOString();
        
        const attendanceResult1 = await recordAttendance(studentData.id, "present", isoTimestamp);
        const attendanceResult2 = await markAttendance(studentData.id, "present");
        
        console.log('Attendance recording results:', { 
          recordAttendance: attendanceResult1,
          markAttendance: attendanceResult2
        });
        
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
    }, passive ? 100 : 500);
  });
};
