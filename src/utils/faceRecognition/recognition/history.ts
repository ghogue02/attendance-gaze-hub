
// Recognition history management
declare global {
  interface Window {
    recognitionHistory: Map<string, number>;
  }
}

export const manageRecognitionHistory = () => {
  if (!window.recognitionHistory) {
    window.recognitionHistory = new Map<string, number>();
  }
  
  const currentTime = Date.now();
  const recognitionHistory = window.recognitionHistory;
  
  const RECOGNITION_COOLDOWN = 10000;
  recognitionHistory.forEach((timestamp, id) => {
    if (currentTime - timestamp > RECOGNITION_COOLDOWN) {
      recognitionHistory.delete(id);
    }
  });
  
  return { recognitionHistory, currentTime };
};

export const checkRecentlyRecognized = async (
  studentId: string,
  recognitionHistory: Map<string, number>,
  currentTime: number
): Promise<boolean> => {
  if (studentId === "all") {
    const RECENT_THRESHOLD = 3000;
    let anyRecent = false;
    
    recognitionHistory.forEach((timestamp) => {
      if (currentTime - timestamp < RECENT_THRESHOLD) {
        anyRecent = true;
      }
    });
    
    return anyRecent;
  }
  
  const lastRecognized = recognitionHistory.get(studentId);
  if (!lastRecognized) return false;
  
  const RECOGNITION_COOLDOWN = 10000;
  return (currentTime - lastRecognized < RECOGNITION_COOLDOWN);
};

export const updateRecognitionHistory = (
  studentId: string,
  recognitionHistory: Map<string, number>,
  currentTime: number
): void => {
  recognitionHistory.set(studentId, currentTime);
};
