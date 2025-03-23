
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
  // Remove checkFaceRegistrationStatus export from here
} from './recognitionUtils';
// Export all registration-related functions
export * from './registration';
export * from './setup';
export * from './types';
export * from './fallbackRecognition';
export * from './facenetIntegration';

// Export functions used in Dashboard and Register
export { getAllBuilders, markAttendance } from './attendance';
