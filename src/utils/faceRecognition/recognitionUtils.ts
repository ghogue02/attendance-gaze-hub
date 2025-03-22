
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
      
      // Clean up old entries (older than 2 minutes)
      const twoMinutesAgo = currentTime - 120000;
      for (const id in recognitionHistory) {
        if (recognitionHistory[id] < twoMinutesAgo) {
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
    
    // In passive mode, require longer intervals between recognitions of the same person
    if (timeSinceLastRecognition < 30000) { // 30 seconds instead of 10
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
 */
export const selectStudentForRecognition = (uniqueStudentIds: string[]) => {
  // For demo purposes, we need to simulate more realistic face detection
  // We'll add a probability of "no face detected" for passive mode
  
  // In a real system, this would be based on actual face detection algorithms
  const rand = Math.random();
  
  // Add ~35% chance of no face detected to simulate more realistic behavior in passive mode
  if (rand < 0.35) {
    console.log("No face detected in frame");
    return null;
  }
  
  const now = new Date();
  // Use milliseconds to get more randomness and less predictability
  const userIndex = (now.getSeconds() * 1000 + now.getMilliseconds()) % uniqueStudentIds.length;
  return uniqueStudentIds[userIndex];
};

