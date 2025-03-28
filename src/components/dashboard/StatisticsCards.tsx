
import { motion } from 'framer-motion';
import { Builder } from '@/components/builder/types';
import { useMemo } from 'react';

interface StatisticsCardsProps {
  builders: Builder[];
}

const StatisticsCards = ({ builders }: StatisticsCardsProps) => {
  // Use useMemo to calculate statistics only when builders array changes
  const stats = useMemo(() => {
    const totalBuilders = builders.length;
    const presentCount = builders.filter(s => s.status === 'present').length;
    const absentCount = builders.filter(s => s.status === 'absent').length;
    const excusedCount = builders.filter(s => s.status === 'excused').length;
    const pendingCount = builders.filter(s => s.status === 'pending').length;
    const attendanceRate = totalBuilders > 0 ? Math.round((presentCount / totalBuilders) * 100) : 0;
    
    console.log('Statistics calculation:', { 
      totalBuilders, 
      presentCount, 
      absentCount, 
      excusedCount, 
      pendingCount,
      attendanceRate,
      currentDate: new Date().toISOString().split('T')[0],
      buildersSample: builders.slice(0, 2)
    });
    
    return {
      totalBuilders,
      presentCount,
      absentCount,
      excusedCount,
      pendingCount,
      attendanceRate
    };
  }, [builders]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-card p-4"
      >
        <span className="text-sm text-muted-foreground">Total</span>
        <div className="text-2xl font-bold mt-1">{stats.totalBuilders}</div>
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
        <div className="text-2xl font-bold mt-1 text-green-600">{stats.presentCount}</div>
        <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
          <div className="h-1 bg-green-500 rounded-full" style={{ width: `${stats.attendanceRate}%` }}></div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="glass-card p-4"
      >
        <span className="text-sm text-muted-foreground">Absent</span>
        <div className="text-2xl font-bold mt-1 text-red-600">{stats.absentCount}</div>
        <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
          <div className="h-1 bg-red-500 rounded-full" style={{ width: `${stats.totalBuilders > 0 ? (stats.absentCount / stats.totalBuilders * 100) : 0}%` }}></div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="glass-card p-4"
      >
        <span className="text-sm text-muted-foreground">Excused</span>
        <div className="text-2xl font-bold mt-1 text-amber-600">{stats.excusedCount}</div>
        <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
          <div className="h-1 bg-amber-500 rounded-full" style={{ width: `${stats.totalBuilders > 0 ? (stats.excusedCount / stats.totalBuilders * 100) : 0}%` }}></div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="glass-card p-4 relative"
      >
        <span className="text-sm text-muted-foreground">Pending</span>
        <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.pendingCount}</div>
        <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
          <div className="h-1 bg-yellow-500 rounded-full" style={{ width: `${stats.totalBuilders > 0 ? (stats.pendingCount / stats.totalBuilders * 100) : 0}%` }}></div>
        </div>
      </motion.div>
    </div>
  );
};

export default StatisticsCards;
