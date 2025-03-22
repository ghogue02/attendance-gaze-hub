
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, ChevronDown, Users, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import AttendanceCamera from '@/components/AttendanceCamera';
import StudentCard, { Student } from '@/components/StudentCard';
import { toast } from 'sonner';

const Index = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedStudent, setDetectedStudent] = useState<Student | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const handleStudentDetected = (student: Student) => {
    setDetectedStudent(student);
    setTimeout(() => {
      setIsCameraActive(false);
    }, 1000);
  };

  const startAttendance = () => {
    setShowIntro(false);
    setDetectedStudent(null);
    setIsCameraActive(true);
  };

  const reset = () => {
    setDetectedStudent(null);
    setIsCameraActive(false);
    setShowIntro(true);
  };

  // Simulated stats for the UI
  const stats = [
    { label: 'Enrolled Students', value: '248', icon: <Users size={20} /> },
    { label: 'Attendance Today', value: '86%', icon: <CheckCircle size={20} /> },
  ];

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
          <span className="section-subtitle inline-block mb-2">Modern Attendance Solution</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            FaceID Attendance System
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            The simplest way to track student attendance using advanced facial recognition technology.
            Fast, accurate, and secure.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center mt-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col space-y-6"
          >
            {showIntro ? (
              <>
                <div className="flex space-x-4 justify-center md:justify-start">
                  {stats.map((stat, i) => (
                    <div 
                      key={stat.label} 
                      className="glass-card p-4 flex-1 flex flex-col items-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                        {stat.icon}
                      </div>
                      <span className="text-2xl font-bold">{stat.value}</span>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                  ))}
                </div>
                
                <div className="glass-card p-6">
                  <h2 className="text-xl font-semibold mb-3">How It Works</h2>
                  <ol className="space-y-4 text-sm">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
                        1
                      </div>
                      <div>
                        <span className="font-medium">Activate the camera</span>
                        <p className="text-muted-foreground mt-1">Click the button below to start the facial recognition process.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
                        2
                      </div>
                      <div>
                        <span className="font-medium">Capture attendance</span>
                        <p className="text-muted-foreground mt-1">Position your face in the frame and click to record your attendance.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
                        3
                      </div>
                      <div>
                        <span className="font-medium">Verification complete</span>
                        <p className="text-muted-foreground mt-1">Your attendance is recorded instantly in the system.</p>
                      </div>
                    </li>
                  </ol>
                </div>
                
                <button 
                  onClick={startAttendance}
                  className="btn-primary py-4 flex items-center justify-center gap-2 mx-auto md:mx-0 w-full md:w-auto"
                >
                  <Camera size={20} />
                  Start Face Recognition
                </button>
              </>
            ) : detectedStudent ? (
              <div className="flex flex-col space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-green-800">Attendance Recorded!</h3>
                  <p className="text-sm text-green-600 mt-1">
                    Successfully verified and recorded.
                  </p>
                </div>
                
                <StudentCard student={detectedStudent} />
                
                <button 
                  onClick={reset}
                  className="btn-primary py-4 flex items-center justify-center gap-2 mx-auto md:mx-0"
                >
                  Record Another Attendance
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-6 items-center md:items-start">
                <h2 className="text-xl font-semibold">Attendance Recognition</h2>
                <p className="text-muted-foreground text-center md:text-left">
                  Position your face clearly in the frame and click the capture button.
                </p>
                
                <button 
                  onClick={() => setIsCameraActive(false)}
                  className="btn-secondary py-3 flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card p-4 md:p-8"
          >
            {isCameraActive ? (
              <AttendanceCamera 
                onStudentDetected={handleStudentDetected}
                isCameraActive={isCameraActive}
              />
            ) : detectedStudent ? (
              <div className="flex flex-col items-center justify-center h-full py-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4"
                >
                  {detectedStudent.image ? (
                    <img 
                      src={detectedStudent.image} 
                      alt={detectedStudent.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                      {detectedStudent.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </motion.div>
                <h3 className="text-2xl font-bold">{detectedStudent.name}</h3>
                <p className="text-muted-foreground">ID: {detectedStudent.studentId}</p>
                <div className="mt-4 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Attendance recorded at {detectedStudent.timeRecorded}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Camera size={40} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Face Recognition</h3>
                <p className="text-muted-foreground max-w-xs mb-6">
                  Click the button to activate the camera and start the attendance process.
                </p>
                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-muted-foreground opacity-60"
                >
                  <ChevronDown size={24} />
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
