
// Re-export all face recognition functions, focusing on production-ready methods
export * from './recognition';

// Export specific functions from recognitionUtils to avoid conflicts
export {
  detectFaces,
  detectFacesWithFallback,
  fetchRegisteredStudents,
  groupRegistrationsByStudent,
  manageRecognitionHistory,
  checkRecentlyRecognized,
  fetchStudentDetails,
  recordAttendance,
  updateRecognitionHistory,
  selectStudentForRecognition,
  checkFaceRegistrationStatus,
} from './recognitionUtils';

// Export all registration-related functions
export * from './registration';
export * from './setup';
export * from './types';

// Export the recognizeFace function from facenetIntegration
export { recognizeFace as recognizeFaceWithFacenet, registerFaceWithFacenet } from './facenetIntegration';

// Export testing functionality
export { testRegistrationFlow } from './facenetIntegration';

// Export the main recognitionService functions
export { processRecognition } from './recognitionService';

// Export functions used in Dashboard and Register
export { getAllBuilders, markAttendance } from './attendance';

// Add the simplified recognition utilities
export { simplifiedRecognize, recordAttendance as recordSimplifiedAttendance } from './simplifiedRecognition';
export { processSimplifiedRecognition } from './simplifiedRecognitionService';
