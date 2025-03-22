import { Student, StudentStatus } from '@/components/StudentCard';
import { supabase } from '@/integrations/supabase/client';

export interface RecognitionResult {
  success: boolean;
  student?: Student;
  message: string;
}

export interface FaceRegistrationResult {
  success: boolean;
  message: string;
  imageCount?: number;
  completed?: boolean;
}

// Function to register a face image for a student
export const registerFaceImage = async (
  studentId: string, 
  imageData: string, 
  angleIndex: number
): Promise<FaceRegistrationResult> => {
  try {
    // In a real implementation, this would:
    // 1. Extract face embeddings from the image
    // 2. Store them in a database linked to the student
    
    // For this demo, we'll simply update the student record
    // In a real implementation, we'd store multiple face embeddings
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
      
    if (fetchError || !student) {
      console.error('Error fetching student:', fetchError);
      return {
        success: false,
        message: 'Student not found'
      };
    }
    
    // Determine if this is the first image (to use as profile pic)
    const isFirstImage = angleIndex === 0;
    
    // If it's the first image, use it as the profile image
    if (isFirstImage) {
      const { error: updateError } = await supabase
        .from('students')
        .update({ image_url: imageData })
        .eq('id', studentId);
        
      if (updateError) {
        console.error('Error updating student image:', updateError);
        return {
          success: false,
          message: 'Failed to save face image'
        };
      }
    }
    
    // Store the face data in a new table for registration
    // In a real implementation, we'd store face embeddings, not raw images
    const { error: registrationError } = await supabase
      .from('face_registrations')
      .insert({
        student_id: studentId,
        face_data: imageData,
        angle_index: angleIndex
      });
      
    if (registrationError) {
      console.error('Error registering face:', registrationError);
      return {
        success: false,
        message: 'Failed to register face data'
      };
    }
    
    // Get the count of angles registered for this student
    const { count, error: countError } = await supabase
      .from('face_registrations')
      .select('*', { count: 'exact', head: false })
      .eq('student_id', studentId);
      
    if (countError) {
      console.error('Error counting registrations:', countError);
    }
    
    const registeredCount = count || 0;
    const requiredAngles = 5; // We require 5 different angle captures
    
    return {
      success: true,
      message: `Angle ${angleIndex + 1} registered successfully`,
      imageCount: registeredCount,
      completed: registeredCount >= requiredAngles
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'An error occurred during face registration'
    };
  }
};

// Function to simulate sending an image to a cloud recognition service
export const recognizeFace = async (imageData: string, passive = false): Promise<RecognitionResult> => {
  // In a real implementation, this would send the image to your cloud face recognition API
  
  return new Promise((resolve) => {
    // Simulate API delay (shorter for passive mode)
    setTimeout(async () => {
      try {
        // In a real implementation, we would:
        // 1. Extract face embeddings from the image
        // 2. Compare against stored embeddings for all students
        // 3. Return the closest match above a confidence threshold
        
        // For demo, we'll use random success/failure with bias toward success
        const successProbability = passive ? 0.85 : 0.7; // Higher success rate in passive mode
        const success = Math.random() < successProbability;
        
        if (success) {
          // Get a random student from the database
          const { data: studentsData, error } = await supabase
            .from('students')
            .select('*')
            .limit(100);
            
          if (error) {
            console.error('Error fetching students:', error);
            resolve({
              success: false,
              message: 'Error fetching student data'
            });
            return;
          }
          
          if (!studentsData || studentsData.length === 0) {
            resolve({
              success: false,
              message: 'No students found in database'
            });
            return;
          }
          
          // Get a random student from the results
          const randomIndex = Math.floor(Math.random() * studentsData.length);
          const dbStudent = studentsData[randomIndex];
          
          // Check if this student has registered their face
          const { count, error: regError } = await supabase
            .from('face_registrations')
            .select('*', { count: 'exact', head: false })
            .eq('student_id', dbStudent.id);
            
          // If student hasn't registered face or not enough angles, return error
          if (regError || !count || count < 5) {
            resolve({
              success: false,
              message: 'Student has not completed face registration'
            });
            return;
          }
          
          // Format time for display
          const timeRecorded = new Date().toLocaleTimeString();
          
          // Record attendance in database
          const { error: attendanceError } = await supabase
            .from('attendance')
            .upsert({
              student_id: dbStudent.id,
              status: 'present',
              time_recorded: new Date().toISOString(),
            }, {
              onConflict: 'student_id,date'
            });
            
          if (attendanceError) {
            console.error('Error recording attendance:', attendanceError);
          }
          
          // Convert database student to application Student format
          const student: Student = {
            id: dbStudent.id,
            name: `${dbStudent.first_name} ${dbStudent.last_name}`,
            studentId: dbStudent.student_id || '',
            status: 'present' as StudentStatus,
            timeRecorded,
            image: dbStudent.image_url || `https://ui-avatars.com/api/?name=${dbStudent.first_name}+${dbStudent.last_name}&background=random`
          };
          
          resolve({
            success: true,
            student,
            message: 'Student successfully recognized'
          });
        } else {
          resolve({
            success: false,
            message: 'No matching student found'
          });
        }
      } catch (error) {
        console.error('Recognition error:', error);
        resolve({
          success: false,
          message: 'An error occurred during recognition'
        });
      }
    }, passive ? 800 : 1500); // Faster recognition in passive mode
  });
};

// Function to get all students (for dashboard)
export const getAllStudents = async (): Promise<Student[]> => {
  try {
    // Get all students from database
    const { data: studentsData, error } = await supabase
      .from('students')
      .select('*');
      
    if (error) {
      console.error('Error fetching students:', error);
      return [];
    }
    
    if (!studentsData || studentsData.length === 0) {
      return [];
    }
    
    // Get attendance data for today
    const today = new Date().toISOString().split('T')[0];
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', today);
      
    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
    }
    
    // Map the DB students to our application's Student format
    const students: Student[] = studentsData.map(dbStudent => {
      // Find matching attendance record for today if it exists
      const attendance = attendanceData?.find(a => a.student_id === dbStudent.id);
      
      return {
        id: dbStudent.id,
        name: `${dbStudent.first_name} ${dbStudent.last_name}`,
        studentId: dbStudent.student_id || '',
        status: (attendance?.status || 'pending') as StudentStatus,
        timeRecorded: attendance?.time_recorded 
          ? new Date(attendance.time_recorded).toLocaleTimeString() 
          : undefined,
        image: dbStudent.image_url || `https://ui-avatars.com/api/?name=${dbStudent.first_name}+${dbStudent.last_name}&background=random`
      };
    });
    
    return students;
  } catch (error) {
    console.error('Error in getAllStudents:', error);
    return [];
  }
};

// Function to mark attendance manually
export const markAttendance = async (studentId: string, status: StudentStatus): Promise<boolean> => {
  try {
    // Update attendance in database
    const { error } = await supabase
      .from('attendance')
      .upsert({
        student_id: studentId,
        status,
        time_recorded: new Date().toISOString(),
      }, {
        onConflict: 'student_id,date'
      });
      
    if (error) {
      console.error('Error marking attendance:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in markAttendance:', error);
    return false;
  }
};

// Function to check if a student has completed face registration
export const checkFaceRegistrationStatus = async (studentId: string): Promise<{completed: boolean, count: number}> => {
  try {
    const { count, error } = await supabase
      .from('face_registrations')
      .select('*', { count: 'exact', head: false })
      .eq('student_id', studentId);
      
    if (error) {
      console.error('Error checking registration status:', error);
      return { completed: false, count: 0 };
    }
    
    const registeredCount = count || 0;
    const requiredAngles = 5; // We require 5 different angle captures
    
    return {
      completed: registeredCount >= requiredAngles,
      count: registeredCount
    };
  } catch (error) {
    console.error('Error in checkFaceRegistrationStatus:', error);
    return { completed: false, count: 0 };
  }
};

// This would integrate with your cloud service in a real implementation
export const setupFaceRecognition = () => {
  console.log('Face recognition service initialized');
  return {
    isReady: true,
    apiEndpoint: 'https://api.example.com/face-recognition'
  };
};
