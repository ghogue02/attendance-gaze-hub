
// Re-export all face recognition functions, avoiding conflicts
export * from './recognition';
export * from './recognitionService';
// Export specific functions from recognitionUtils to avoid conflicts
export {
  detectFaces,
  fetchRegisteredStudents,
  groupRegistrationsByStudent,
  manageRecognitionHistory,
  checkRecentlyRecognized,
  fetchStudentDetails,
  recordAttendance,
  updateRecognitionHistory,
  selectStudentForRecognition,
  // We won't export checkFaceRegistrationStatus from here
  // since it's already exported from registration/checkStatus
} from './recognitionUtils';
export * from './registration';
export * from './setup';
export * from './types';
export * from './fallbackRecognition';

// Export functions used in Dashboard and Register
export { getAllBuilders, markAttendance } from './attendance';
