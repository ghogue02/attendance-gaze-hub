
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, Search, Filter, RefreshCw, Download } from 'lucide-react';
import Header from '@/components/Header';
import StudentCard, { Student, StudentStatus } from '@/components/StudentCard';
import { getAllStudents, markAttendance } from '@/utils/faceRecognition';
import { toast } from 'sonner';

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
      console.log('Loaded students:', data); // Add logging to debug
      setStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent') => {
    try {
      const success = await markAttendance(studentId, status);
      
      if (success) {
        // Update local state
        setStudents(prevStudents => 
          prevStudents.map(student => 
            student.id === studentId
              ? { 
                  ...student, 
                  status,
                  timeRecorded: new Date().toLocaleTimeString() 
                }
              : student
          )
        );
        
        toast.success(`Attendance marked as ${status}`);
      } else {
        toast.error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('An error occurred while updating attendance');
    }
  };

  // Calculate attendance statistics
  const totalStudents = students.length;
  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const pendingCount = students.filter(s => s.status === 'pending').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Header />
      
      <main className="pt-24 pb-16 px-4 container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <span className="section-subtitle inline-block mb-1">Attendance Records</span>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              <span className="text-sm">{selectedDate}</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </div>
            
            <button 
              onClick={loadStudents} 
              className="btn-secondary flex items-center gap-2 py-2 px-3"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button className="btn-primary flex items-center gap-2 py-2 px-3">
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </motion.div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-card p-4"
          >
            <span className="text-sm text-muted-foreground">Total</span>
            <div className="text-2xl font-bold mt-1">{totalStudents}</div>
            <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
              <div className="h-1 bg-primary rounded-full" style={{ width: '100%' }}></div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass-card p-4"
          >
            <span className="text-sm text-muted-foreground">Present</span>
            <div className="text-2xl font-bold mt-1 text-green-600">{presentCount}</div>
            <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
              <div className="h-1 bg-green-500 rounded-full" style={{ width: `${attendanceRate}%` }}></div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="glass-card p-4"
          >
            <span className="text-sm text-muted-foreground">Absent</span>
            <div className="text-2xl font-bold mt-1 text-red-600">{absentCount}</div>
            <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
              <div className="h-1 bg-red-500 rounded-full" style={{ width: `${absentCount / totalStudents * 100}%` }}></div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="glass-card p-4"
          >
            <span className="text-sm text-muted-foreground">Pending</span>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{pendingCount}</div>
            <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
              <div className="h-1 bg-yellow-500 rounded-full" style={{ width: `${pendingCount / totalStudents * 100}%` }}></div>
            </div>
          </motion.div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StudentStatus | 'all')}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        
        {/* Students List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="mt-4 text-muted-foreground">Loading student data...</p>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <h3 className="text-xl font-medium mb-2">No students found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No results matching "${searchQuery}"` 
                : "There are no students with the selected status"}
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="btn-secondary py-2 mx-auto"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <StudentCard 
                  student={student} 
                  onVerify={() => {
                    const newStatus = student.status === 'present' ? 'absent' : 'present';
                    handleMarkAttendance(student.id, newStatus);
                  }} 
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
