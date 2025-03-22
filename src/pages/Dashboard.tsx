
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Student, StudentStatus } from '@/components/StudentCard';
import { getAllStudents, markAttendance } from '@/utils/faceRecognition';
import { toast } from 'sonner';

// Import new components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatisticsCards from '@/components/dashboard/StatisticsCards';
import StudentFilters from '@/components/dashboard/StudentFilters';
import StudentsList from '@/components/dashboard/StudentsList';

const Dashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString());

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    // Apply filters when students, search query, or status filter changes
    let results = [...students];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(student => 
        student.name.toLowerCase().includes(query) || 
        student.studentId.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== 'all') {
      results = results.filter(student => student.status === statusFilter);
    }
    
    setFilteredStudents(results);
  }, [students, searchQuery, statusFilter]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const data = await getAllStudents();
      console.log('Loaded students:', data);
      setStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAttendance = async (studentId: string) => {
    try {
      // Find the current student's status to toggle it
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      
      const newStatus: 'present' | 'absent' = student.status === 'present' ? 'absent' : 'present';
      const success = await markAttendance(studentId, newStatus);
      
      if (success) {
        // Update local state
        setStudents(prevStudents => 
          prevStudents.map(student => 
            student.id === studentId
              ? { 
                  ...student, 
                  status: newStatus,
                  timeRecorded: new Date().toLocaleTimeString() 
                }
              : student
          )
        );
        
        toast.success(`Attendance marked as ${newStatus}`);
      } else {
        toast.error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('An error occurred while updating attendance');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Header />
      
      <main className="pt-24 pb-16 px-4 container max-w-6xl mx-auto">
        <DashboardHeader 
          selectedDate={selectedDate} 
          onRefresh={loadStudents} 
        />
        
        <StatisticsCards students={students} />
        
        <StudentFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        
        <StudentsList 
          isLoading={isLoading}
          filteredStudents={filteredStudents}
          searchQuery={searchQuery}
          onClearFilters={handleClearFilters}
          onVerify={handleMarkAttendance}
        />
      </main>
    </div>
  );
};

export default Dashboard;
