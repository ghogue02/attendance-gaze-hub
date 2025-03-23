
// Re-export all face recognition functions, focusing on production-ready methods
export * from './recognition';

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
  checkFaceRegistrationStatus,
} from './recognitionUtils';

// Export all registration-related functions
export * from './registration';
export * from './setup';
export * from './types';

// Export TensorFlow-based face recognition functions (not fallback)
export { 
  recognizeFace,
  registerFace,
  processFaceForRegistration,
  detectFaces as detectFacesWithFacenet,
  generateEmbedding,
  storeFaceEmbedding,
  findClosestMatch,
  calculateEuclideanDistance,
  testRegistrationFlow
} from './facenetIntegration';

// Export functions used in Dashboard and Register
export { getAllBuilders, markAttendance } from './attendance';

// Export the main recognitionService functions
export { processRecognition } from './recognitionService';
