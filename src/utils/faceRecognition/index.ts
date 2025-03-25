
// Re-export all functions from submodules
export * from './recognition';
// Export from recognitionUtils with selective re-exports to avoid name conflicts
export {
  detectFaces,
  detectFacesWithFallback,
  fetchRegisteredStudents,
  groupRegistrationsByStudent,
  manageRecognitionHistory,
  checkRecentlyRecognized,
  updateRecognitionHistory,
  fetchStudentDetails,
  // We'll rename the following exports to avoid conflicts
  recordAttendance as recordAttendanceFromUtils,
  selectStudentForRecognition
  // Not exporting checkFaceRegistrationStatus from here since we have it in registration
} from './recognitionUtils';
export * from './setup';
export * from './attendance';
export * from './simplifiedRecognition';
export * from './simplifiedRecognitionService';
export * from './registration/index';
export * from './aiEnhancement';
