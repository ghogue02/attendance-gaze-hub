
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
  // Remove checkFaceRegistrationStatus export from here
} from './recognitionUtils';

// Export all registration-related functions
export * from './registration';
export * from './setup';
export * from './types';

// Explicitly export functions from fallbackRecognition and facenetIntegration to avoid conflicts
export { 
  registerFaceWithoutDetection,
  recognizeFaceBasic
} from './fallbackRecognition';

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
