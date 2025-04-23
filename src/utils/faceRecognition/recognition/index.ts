
// Main exports from the recognition module
export * from './types';
export * from './core';
export * from './history';
export * from './studentService';
export * from './utils';

// Additional functions that were moved from recognitionUtils.ts but need to be exported
export const fetchRegisteredStudents = async () => {
  try {
    const { data, error } = await fetch('/api/students/registered')
      .then(res => res.json());
    
    if (error) {
      console.error('Error fetching registered students:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchRegisteredStudents:', error);
    return [];
  }
};

export const groupRegistrationsByStudent = (registrations: any[]) => {
  if (!Array.isArray(registrations)) {
    console.error('Invalid registrations data provided');
    return new Map();
  }
  
  const studentMap = new Map();
  
  registrations.forEach(registration => {
    if (registration && registration.students && registration.students.id) {
      const studentId = registration.students.id;
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, []);
      }
      
      studentMap.get(studentId).push(registration);
    }
  });
  
  return studentMap;
};

export const recordAttendance = async (
  studentId: string, 
  status: string = "present", 
  timestamp: string = new Date().toISOString()
): Promise<boolean> => {
  try {
    if (!studentId) {
      throw new Error('Student ID is required');
    }
    
    // Format timestamp if needed
    if (!timestamp) {
      timestamp = new Date().toISOString();
    }
    
    // Call the attendance API
    const response = await fetch('/api/attendance/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, status, timestamp })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to record attendance: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.error('Error recording attendance:', error);
    return false;
  }
};
