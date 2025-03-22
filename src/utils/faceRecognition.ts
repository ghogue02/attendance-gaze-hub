
import { Student, StudentStatus } from '@/components/StudentCard';

// Mock database for demo purposes
const mockStudentDatabase: Student[] = [
  {
    id: '1',
    name: 'Emma Thompson',
    studentId: 'S1001',
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: '2',
    name: 'Michael Chen',
    studentId: 'S1002',
    status: 'present',
    timeRecorded: '9:32 AM',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: '3',
    name: 'Sophia Rodriguez',
    studentId: 'S1003',
    status: 'absent',
    timeRecorded: '10:15 AM',
    image: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: '4',
    name: 'Jake Wilson',
    studentId: 'S1004',
    status: 'present',
    timeRecorded: '8:45 AM',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: '5',
    name: 'Aisha Patel',
    studentId: 'S1005',
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: '6',
    name: 'Tyler Johnson',
    studentId: 'S1006',
    status: 'present',
    timeRecorded: '9:15 AM',
    image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80'
  }
];

export interface RecognitionResult {
  success: boolean;
  student?: Student;
  message: string;
}

// Function to simulate sending an image to a cloud recognition service
export const recognizeFace = async (imageData: string): Promise<RecognitionResult> => {
  // In a real implementation, this would send the image to your cloud face recognition API
  
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      // Random success/failure for demo
      const success = Math.random() > 0.3;
      
      if (success) {
        // Get a random student from the mock database
        const randomIndex = Math.floor(Math.random() * mockStudentDatabase.length);
        const student = { 
          ...mockStudentDatabase[randomIndex],
          status: 'present' as StudentStatus,
          timeRecorded: new Date().toLocaleTimeString()
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
    }, 1500);
  });
};

// Function to get all students (for dashboard)
export const getAllStudents = async (): Promise<Student[]> => {
  // In a real implementation, this would fetch from your database
  
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      resolve(mockStudentDatabase);
    }, 800);
  });
};

// Function to mark attendance manually
export const markAttendance = async (studentId: string, status: StudentStatus): Promise<boolean> => {
  // In a real implementation, this would update your database
  
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      // Success 95% of the time
      resolve(Math.random() > 0.05);
    }, 600);
  });
};

// This would integrate with your cloud service in a real implementation
export const setupFaceRecognition = () => {
  console.log('Face recognition service initialized');
  // In a real implementation, this might set up API keys, initialize the service, etc.
  return {
    isReady: true,
    apiEndpoint: 'https://api.example.com/face-recognition'
  };
};
