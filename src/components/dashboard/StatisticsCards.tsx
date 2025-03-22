
import { motion } from 'framer-motion';
import { Builder } from '@/components/BuilderCard';

interface StatisticsCardsProps {
  builders: Builder[];
}

const StatisticsCards = ({ builders }: StatisticsCardsProps) => {
  // Calculate attendance statistics based on actual data
  const totalBuilders = builders.length;
  const presentCount = builders.filter(s => s.status === 'present').length;
  const absentCount = builders.filter(s => s.status === 'absent').length;
  const pendingCount = builders.filter(s => s.status === 'pending').length;
  const attendanceRate = totalBuilders > 0 ? Math.round((presentCount / totalBuilders) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-card p-4"
      >
        <span className="text-sm text-muted-foreground">Total</span>
        <div className="text-2xl font-bold mt-1">{totalBuilders}</div>
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
          <div className="h-1 bg-red-500 rounded-full" style={{ width: `${totalBuilders > 0 ? (absentCount / totalBuilders * 100) : 0}%` }}></div>
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
          <div className="h-1 bg-yellow-500 rounded-full" style={{ width: `${totalBuilders > 0 ? (pendingCount / totalBuilders * 100) : 0}%` }}></div>
        </div>
      </motion.div>
    </div>
  );
};

export default StatisticsCards;
