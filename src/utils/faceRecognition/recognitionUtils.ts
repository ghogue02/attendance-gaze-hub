import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch registered students from the database
 */
export const fetchRegisteredStudents = async () => {
  const { data: registeredStudents, error: regError } = await supabase
    .from('face_registrations')
    .select('student_id, face_data')
    .order('created_at', { ascending: false });
    
  if (regError) {
    console.error('Error fetching registered students:', regError);
    return { success: false, message: 'Error checking face registrations', data: null };
  }
  
  if (!registeredStudents || registeredStudents.length === 0) {
    console.log('No registered faces found in the system');
    return { success: false, message: 'No registered faces found in the system', data: null };
  }

  return { success: true, data: registeredStudents };
};

/**
 * Group face registrations by student ID
 */
export const groupRegistrationsByStudent = (registeredStudents: any[]) => {
  const studentRegistrations: {[key: string]: string[]} = {};
  
  registeredStudents.forEach(reg => {
    if (!studentRegistrations[reg.student_id]) {
      studentRegistrations[reg.student_id] = [];
    }
    if (reg.face_data) {
      studentRegistrations[reg.student_id].push(reg.face_data);
    }
  });
  
  return studentRegistrations;
};

/**
 * Manage recognition history to prevent duplicate detections
 */
export const manageRecognitionHistory = () => {
  const now = new Date();
  const currentTime = now.getTime();
  
  // Get the recognition history from sessionStorage
  const recognitionHistoryStr = window.sessionStorage.getItem('recognitionHistory');
  let recognitionHistory: {[id: string]: number} = {};
  
  if (recognitionHistoryStr) {
    try {
      recognitionHistory = JSON.parse(recognitionHistoryStr);
      
      // Clean up old entries (older than 1 minute)
      const oneMinuteAgo = currentTime - 60000;
      for (const id in recognitionHistory) {
        if (recognitionHistory[id] < oneMinuteAgo) {
          delete recognitionHistory[id];
        }
      }
    } catch (e) {
      console.error('Error parsing recognition history:', e);
      recognitionHistory = {};
    }
  }
  
  return { recognitionHistory, currentTime };
};

/**
 * Check if student was recently recognized
 */
export const checkRecentlyRecognized = (studentId: string, recognitionHistory: {[id: string]: number}, currentTime: number) => {
  if (studentId && recognitionHistory[studentId]) {
    const lastRecognitionTime = recognitionHistory[studentId];
    const timeSinceLastRecognition = currentTime - lastRecognitionTime;
    
    // Reduce cooldown for faster recognition in line scenarios (10 seconds)
    if (timeSinceLastRecognition < 10000) {
      console.log(`User ${studentId} was recently recognized ${timeSinceLastRecognition}ms ago. Skipping.`);
      return true;
    }
  }
  
  return false;
};

/**
 * Get student details from database
 */
export const fetchStudentDetails = async (studentId: string) => {
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();
    
  if (studentError || !studentData) {
    console.error('Error fetching student data:', studentError);
    return { success: false, message: 'Error retrieving student information', data: null };
  }
  
  return { success: true, data: studentData };
};

/**
 * Record attendance in database
 */
export const recordAttendance = async (studentId: string) => {
  const { error: attendanceError } = await supabase
    .from('attendance')
    .upsert({
      student_id: studentId,
      status: 'present',
      time_recorded: new Date().toISOString(),
    }, {
      onConflict: 'student_id,date'
    });
    
  if (attendanceError) {
    console.error('Error recording attendance:', attendanceError);
    return { success: false, message: 'Error recording attendance' };
  }
  
  console.log('Successfully recorded attendance');
  return { success: true, message: 'Successfully recorded attendance' };
};

/**
 * Update recognition history in session storage
 */
export const updateRecognitionHistory = (studentId: string, recognitionHistory: {[id: string]: number}, currentTime: number) => {
  recognitionHistory[studentId] = currentTime;
  window.sessionStorage.setItem('recognitionHistory', JSON.stringify(recognitionHistory));
};

/**
 * Select a student for recognition in a more realistic way
 * This function simulates face recognition in demo mode
 * 
 * @param uniqueStudentIds Array of student IDs to select from
 * @param faceDetected When true, skip "no face detected" simulation since we've already confirmed a face exists
 */
export const selectStudentForRecognition = (uniqueStudentIds: string[], faceDetected = false) => {
  // Since Google Vision API has already confirmed if a face exists or not,
  // we can skip the "no face detected" simulation when faceDetected is true
  if (!faceDetected) {
    // This is the old behavior for when we're not using Vision API
    // Increase probability of "no face detected" for better realism
    // This better simulates a camera that won't randomly detect people
    const noFaceDetectionRate = 0.85; // 85% chance of no face when first starting
    
    // Get a unique seed based on the current frame to add consistency
    // This helps simulate the camera "seeing" the same thing across multiple frames
    const frameConsistency = Math.floor(Date.now() / 250); // Changes every 250ms
    
    // Seed the random number generator with the frame consistency value
    // to simulate the camera seeing the same results for a brief period
    const seedRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    // Generate frame-consistent random number
    const rand = seedRandom(frameConsistency);
    
    // Initial startup - higher chance of no face detected
    // This prevents immediate false detections when camera first starts
    if (window.sessionStorage.getItem('cameraStartTime') === null) {
      // Set camera start time in session storage
      window.sessionStorage.setItem('cameraStartTime', Date.now().toString());
      console.log("Camera just started, higher chance of no face detected");
      
      // 95% chance of no face when camera first starts
      if (rand < 0.95) {
        console.log("No face detected in frame (camera startup)");
        return null;
      }
    }
    
    // Get time since camera started
    const cameraStartTime = parseInt(window.sessionStorage.getItem('cameraStartTime') || '0');
    const timeSinceStart = Date.now() - cameraStartTime;
    
    // For the first 2 seconds after camera starts, very high chance of no face
    if (timeSinceStart < 2000 && rand < 0.95) {
      console.log("No face detected in frame (camera warmup)");
      return null;
    }
    
    // Normal operation - still higher chance of no face than before
    if (rand < noFaceDetectionRate) {
      console.log("No face detected in frame");
      return null;
    }
  }
  
  // If we're here, we have a face (either from Vision API or by luck in the simulation)
  // Select which student it is
  // Use a consistent seed for student selection
  const studentSelectionSeed = Math.floor(Date.now() / 500); // Changes every 500ms for stability
  const seedRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  const studentRand = seedRandom(studentSelectionSeed);
  const userIndex = Math.floor(studentRand * uniqueStudentIds.length);
  
  return uniqueStudentIds[userIndex];
};

/**
 * Detect faces in an image
 * 
 * @param imageData Base64-encoded image data
 * @param debugMode Enable debug mode for logging
 */
export const detectFaces = async (imageData: string, debugMode: boolean = false): Promise<FaceDetectionResult> => {
  try {
    if (debugMode) {
      console.log('Detecting faces in image...');
    }

    // Call the Supabase Edge Function to perform face detection
    const { data, error } = await supabase.functions.invoke('detect-faces', {
      body: { 
        imageData,
        isPassive: true,
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      console.error('Face detection error:', error);
      return {
        success: false,
        hasFaces: false,
        message: 'Error connecting to face detection service'
      };
    }

    if (!data.success) {
      console.error('Face detection service error:', data.error);
      return {
        success: false,
        hasFaces: false,
        message: data.error || 'Face detection service error'
      };
    }

    if (debugMode) {
      console.log('Face detection result:', data);
    }

    return {
      success: true,
      hasFaces: data.hasFaces,
      faceCount: data.faceCount,
      confidence: data.confidence,
      message: data.message
    };
  } catch (error) {
    console.error('Error during face detection:', error);
    return {
      success: false,
      hasFaces: false,
      message: 'Exception during face detection'
    };
  }
};
