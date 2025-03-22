
import { Student, StudentStatus } from '@/components/StudentCard';
import { supabase } from '@/integrations/supabase/client';

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
