
// Re-export all face recognition functions, avoiding conflicts
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

// Explicitly export functions from fallbackRecognition to avoid conflicts
export { 
  recognizeFaceBasic,
  registerFaceWithoutDetection 
} from './fallbackRecognition';

// Explicitly export functions from facenetIntegration with renamed exports to avoid conflicts
export { 
  recognizeFace as recognizeFaceWithFacenet,
  registerFace,
  processFaceForRegistration,
  detectFaces as detectFacesWithFacenet,
  generateEmbedding,
  storeFaceEmbedding,
  findClosestMatch,
  calculateEuclideanDistance
} from './facenetIntegration';

// Export functions used in Dashboard and Register
export { getAllBuilders, markAttendance } from './attendance';
