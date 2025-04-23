
export const selectStudentForRecognition = (
  studentIds: string[], 
  useRandom: boolean = true
): string => {
  if (studentIds.length === 0) {
    throw new Error('No student IDs provided');
  }
  
  if (studentIds.length === 1) {
    return studentIds[0];
  }
  
  if (useRandom) {
    const randomIndex = Math.floor(Math.random() * studentIds.length);
    return studentIds[randomIndex];
  }
  
  return studentIds[0];
};
