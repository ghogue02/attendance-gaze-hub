
import { Student, StudentStatus } from '@/components/StudentCard';

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
