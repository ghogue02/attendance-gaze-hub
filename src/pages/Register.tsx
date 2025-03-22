
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ListCheck, Check, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import FaceRegistration from '@/components/FaceRegistration';
import StudentCard, { Student } from '@/components/StudentCard';
import { getAllStudents, checkFaceRegistrationStatus } from '@/utils/faceRecognition';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Register = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<{[key: string]: {completed: boolean, count: number}}>({});

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const allStudents = await getAllStudents();
      setStudents(allStudents);
      
      // Get registration status for all students
      const statuses: {[key: string]: {completed: boolean, count: number}} = {};
      
      for (const student of allStudents) {
        const status = await checkFaceRegistrationStatus(student.id);
        statuses[student.id] = status;
      }
      
      setRegistrationStatus(statuses);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRegistration = (student: Student) => {
    setSelectedStudent(student);
    setRegistrationOpen(true);
  };

  const handleRegistrationComplete = () => {
    // Refresh the list to update status
    loadStudents();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/50">
      <Header />
      
      <main className="pt-24 pb-16 px-4 container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="section-subtitle inline-block mb-2">Face Registration</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Register Your Face
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Register your face from multiple angles to ensure accurate recognition for attendance tracking.
          </p>
        </motion.div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:flex md:gap-8 max-w-md mx-auto">
          <div className="glass-card p-4 flex-1 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Users size={20} />
            </div>
            <span className="text-2xl font-bold">{students.length}</span>
            <span className="text-xs text-muted-foreground">Total Students</span>
          </div>
          
          <div className="glass-card p-4 flex-1 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <ListCheck size={20} />
            </div>
            <span className="text-2xl font-bold">
              {Object.values(registrationStatus).filter(s => s.completed).length}
            </span>
            <span className="text-xs text-muted-foreground">Registered Faces</span>
          </div>
        </div>

        <div className="glass-card p-6 mb-10">
          <h2 className="text-xl font-semibold mb-3">How It Works</h2>
          <ol className="space-y-4 text-sm">
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
                1
              </div>
              <div>
                <span className="font-medium">Select your profile</span>
                <p className="text-muted-foreground mt-1">Find your name in the list below and click "Register Face"</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
                2
              </div>
              <div>
                <span className="font-medium">Capture from multiple angles</span>
                <p className="text-muted-foreground mt-1">Follow the instructions to capture your face from different angles</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
                3
              </div>
              <div>
                <span className="font-medium">Registration complete</span>
                <p className="text-muted-foreground mt-1">The system can now recognize you automatically for attendance</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Students</h2>
          
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-10 glass-card">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm text-muted-foreground">There are no students in the system yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {students.map(student => (
                <div key={student.id} className="glass-card p-4">
                  <StudentCard student={student} />
                  
                  <div className="mt-4 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Registration Status:</span>
                      {registrationStatus[student.id]?.completed ? (
                        <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
                          <Check size={14} className="mr-1" />
                          Complete
                        </span>
                      ) : (
                        <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          {registrationStatus[student.id]?.count || 0}/5 Angles
                        </span>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleStartRegistration(student)}
                      variant={registrationStatus[student.id]?.completed ? "outline" : "default"}
                      className="w-full mt-2"
                    >
                      {registrationStatus[student.id]?.completed ? "Update Registration" : "Register Face"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {selectedStudent && (
        <FaceRegistration
          student={selectedStudent}
          open={registrationOpen}
          onOpenChange={setRegistrationOpen}
          onComplete={handleRegistrationComplete}
        />
      )}
    </div>
  );
};

export default Register;
