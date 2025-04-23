
import { Builder } from '@/components/builder/types';
import {
  detectFaces,
  manageRecognitionHistory,
  checkRecentlyRecognized,
  updateRecognitionHistory,
  fetchStudentDetails,
  checkFaceRegistrationStatus,
  selectStudentForRecognition,
  fetchRegisteredStudents,
  groupRegistrationsByStudent,
  recordAttendance
} from './recognition';

export {
  detectFaces,
  manageRecognitionHistory,
  checkRecentlyRecognized,
  updateRecognitionHistory,
  fetchStudentDetails,
  checkFaceRegistrationStatus,
  selectStudentForRecognition,
  fetchRegisteredStudents,
  groupRegistrationsByStudent,
  recordAttendance
};

// Expose the detectFacesWithFallback as the main public API
export const detectFacesWithFallback = async (imageData: string) => {
  try {
    console.log('Starting face detection with fallback mechanism');
    
    const result = await detectFaces(imageData, false, 0);
    
    if (result.success && result.hasFaces) {
      return result;
    }
    
    console.log('First attempt failed, trying with preview mode');
    
    const previewResult = await detectFaces(imageData, true, 1);
    
    if (previewResult.success && previewResult.hasFaces) {
      return previewResult;
    }
    
    console.log('Preview mode failed, trying registration mode');
    
    const registrationResult = await detectFaces(imageData, false, 3);
    
    return registrationResult;
  } catch (error) {
    console.error('All face detection attempts failed:', error);
    
    return {
      success: true,
      hasFaces: false,
      message: 'Face detection failed, continuing without detection',
      faceCount: 0,
      confidence: 0,
      debugAttempt: 0
    };
  }
};
