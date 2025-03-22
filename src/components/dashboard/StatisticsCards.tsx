
import { motion } from 'framer-motion';
import { Student } from '@/components/StudentCard';

interface StatisticsCardsProps {
  students: Student[];
}

const StatisticsCards = ({ students }: StatisticsCardsProps) => {
  // Calculate attendance statistics
  const totalStudents = students.length;
  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const pendingCount = students.filter(s => s.status === 'pending').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  return (
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
  );
};

export default StatisticsCards;
