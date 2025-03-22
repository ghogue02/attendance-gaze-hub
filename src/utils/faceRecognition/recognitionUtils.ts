import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/BuilderCard';

// Cache for fetched data
const dataCache = {
  registeredStudents: null,
  recognitionHistory: new Map(),
  lastCleanup: Date.now()
};

interface DetectFacesResult {
  success: boolean;
  message?: string;
  hasFaces: boolean;
  faceCount?: number;
  confidence?: number;
  faceVertices?: any;
}

// Function to detect faces using Google Cloud Vision API via Supabase Edge Function
export async function detectFaces(imageData: string, isPassive = false, debugAttempt = 0) {
  try {
    console.log(`Calling detect-faces edge function (attempt #${debugAttempt})...`);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('detect-faces', {
      body: { 
        imageData, 
        isPassive,
        timestamp: new Date().toISOString(),
        debugAttempt
      }
    });
    
    if (error) {
      console.error('Error calling face detection function:', error);
      return { 
        success: false, 
        message: 'Error calling face detection service: ' + error.message,
        hasFaces: false,
        debugAttempt
      };
    }
    
    if (!data || !data.success) {
      console.error('Face detection was not successful:', data?.error || 'Unknown error');
      return {
        success: false,
        message: data?.error || 'Face detection failed',
        hasFaces: false,
        debugAttempt
      };
    }
    
    console.log(`Face detection result:`, data);
    
    // Process the response
    return { 
      success: true,
      hasFaces: data.hasFaces,
      faceCount: data.faceCount,
      confidence: data.confidence,
      faceVertices: data.faceVertices,
      message: data.message || (data.hasFaces ? `Detected ${data.faceCount} faces` : 'No face detected in frame'),
      debugAttempt
    };
  } catch (error) {
    console.error('Face detection error:', error);
    return { 
      success: false, 
      message: 'Face detection service error: ' + (error instanceof Error ? error.message : String(error)),
      hasFaces: false,
      debugAttempt
    };
  }
}

interface RegisteredStudent {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  image_url: string;
  last_face_update: string;
}

interface FetchRegisteredStudentsResult {
  success: boolean;
  message?: string;
  data?: RegisteredStudent[];
}

// Function to fetch all students who have completed face registration
export const fetchRegisteredStudents = async (): Promise<FetchRegisteredStudentsResult> => {
  try {
    // Check if data is cached and less than 5 minutes old
    if (dataCache.registeredStudents && Date.now() - dataCache.lastCleanup < 300000) {
      console.log('Using cached registered students data');
      return {
        success: true,
        data: dataCache.registeredStudents
      };
    }
    
    console.log('Fetching registered students from database');
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .not('image_url', 'is', null); // Only fetch students with a profile image
      
    if (error) {
      console.error('Error fetching students:', error);
      return {
        success: false,
        message: 'Failed to fetch registered students'
      };
    }
    
    // Cache the fetched data
    dataCache.registeredStudents = data;
    dataCache.lastCleanup = Date.now();
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error fetching registered students:', error);
    return {
      success: false,
      message: 'An error occurred while fetching registered students'
    };
  }
};

interface FaceRegistration {
  id: string;
  student_id: string;
  face_data: string;
  angle_index: number;
}

// Function to group face registrations by student ID
export const groupRegistrationsByStudent = (registrations: RegisteredStudent[]): { [studentId: string]: FaceRegistration[] } => {
  const grouped: { [studentId: string]: FaceRegistration[] } = {};
  
  registrations.forEach(student => {
    if (!grouped[student.id]) {
      grouped[student.id] = [];
    }
    grouped[student.id].push({
      id: student.id,
      student_id: student.student_id,
      face_data: student.image_url,
      angle_index: 0 // This is a simplification
    } as FaceRegistration);
  });
  
  return grouped;
};

interface ManageRecognitionHistoryResult {
  recognitionHistory: Map<string, number>;
  currentTime: number;
}

// Function to manage recognition history and clean up old entries
export const manageRecognitionHistory = (): ManageRecognitionHistoryResult => {
  const currentTime = Date.now();
  const recognitionHistory = dataCache.recognitionHistory;
  
  // Clean up history every 5 minutes
  if (currentTime - dataCache.lastCleanup > 300000) {
    console.log('Cleaning up recognition history');
    const cutoff = currentTime - 60000; // 1 minute
    
    recognitionHistory.forEach((timestamp, studentId) => {
      if (timestamp < cutoff) {
        recognitionHistory.delete(studentId);
      }
    });
    
    dataCache.lastCleanup = currentTime;
  }
  
  return { recognitionHistory, currentTime };
};

// Function to check if a student was recently recognized
export const checkRecentlyRecognized = (studentId: string, recognitionHistory: Map<string, number>, currentTime: number): boolean => {
  const lastRecognized = recognitionHistory.get(studentId);
  const recentlyRecognized = lastRecognized && (currentTime - lastRecognized < 10000); // 10 seconds
  
  if (recentlyRecognized) {
    console.log(`Student ${studentId} was recently recognized`);
  }
  
  return recentlyRecognized;
};

interface FetchStudentDetailsResult {
  success: boolean;
  message?: string;
  data?: RegisteredStudent;
}

// Function to fetch student details from the database
export const fetchStudentDetails = async (studentId: string): Promise<FetchStudentDetailsResult> => {
  try {
    console.log(`Fetching student details for student ID ${studentId}`);
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
      
    if (error) {
      console.error('Error fetching student details:', error);
      return {
        success: false,
        message: 'Failed to fetch student details'
      };
    }
    
    return {
      success: true,
      data: data as RegisteredStudent
    };
  } catch (error) {
    console.error('Error fetching student details:', error);
    return {
      success: false,
      message: 'An error occurred while fetching student details'
    };
  }
};

// Function to record attendance
export const recordAttendance = async (studentId: string, status: string = "present") => {
  try {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        student_id: studentId,
        status: status,
        date: date,
        time_recorded: time
      });
    
    if (error) {
      console.error('Error recording attendance:', error);
      return {
        success: false,
        message: 'Failed to record attendance'
      };
    }
    
    return {
      success: true,
      message: 'Attendance recorded successfully'
    };
  } catch (error) {
    console.error('Exception during attendance recording:', error);
    return {
      success: false,
      message: 'Exception during attendance recording'
    };
  }
};

// Function to update recognition history
export const updateRecognitionHistory = (studentId: string, recognitionHistory: Map<string, number>, currentTime: number): void => {
  console.log(`Updating recognition history for student ID ${studentId}`);
  recognitionHistory.set(studentId, currentTime);
};

// Function to select a student for recognition (simulation)
export const selectStudentForRecognition = (studentIds: string[], hasFaces: boolean): string => {
  // If face detection is certain, pick a random student
  const randomIndex = Math.floor(Math.random() * studentIds.length);
  return studentIds[randomIndex];
};

interface CheckFaceRegistrationStatusResult {
  completed: boolean;
  count: number;
  nextAngleIndex?: number;
}

export const checkFaceRegistrationStatus = async (studentId: string): Promise<CheckFaceRegistrationStatusResult> => {
  try {
    console.log(`Checking face registration status for student ${studentId}`);
    
    const { data, error } = await supabase
      .from('face_registrations')
      .select('*')
      .eq('student_id', studentId);
      
    if (error) {
      console.error('Error checking face registration status:', error);
      return {
        completed: false,
        count: 0
      };
    }
    
    const count = data.length;
    const completed = count >= 5;
    
    return {
      completed,
      count
    };
  } catch (error) {
    console.error('Error checking face registration status:', error);
    return {
      completed: false,
      count: 0
    };
  }
};
