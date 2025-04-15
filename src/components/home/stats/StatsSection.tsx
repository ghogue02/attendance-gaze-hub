import { Users, CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { StatCard } from './';
import { 
  markPendingAsAbsent, 
  processAttendanceForDate, 
  fetchStats,
  processPendingAttendance,
  clearAutomatedNotesForPresentStudents 
} from '@/services/attendance';
import { processSpecificDateIssues } from '@/services/attendance/historicalDates';
import { subscribeToAttendanceChanges } from '@/services/attendance/realtime';

export const StatsSection = () => {
  const [stats, setStats] = useState({
    totalBuilders: 0,
    attendanceRate: 0
  });
  const isMounted = useRef(true);
  const processingRef = useRef(false);
  
  const lastProcessDateRef = useRef<string | null>(null);
  
  const processAttendance = async () => {
    if (processingRef.current) {
      return;
    }
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    if (lastProcessDateRef.current === todayString) {
      console.log(`StatsSection: Already processed attendance for ${todayString}`);
      return;
    }
    
    try {
      processingRef.current = true;
      console.log(`StatsSection: Processing attendance for ${todayString}`);
      
      await processSpecificDateIssues();
      
      const issueDates = [
        { date: '2025-04-01', storageKey: `fix_applied_2025_04_01` },
        { date: '2025-04-02', storageKey: `fix_applied_2025_04_02` },
        { date: '2025-04-03', storageKey: `fix_applied_2025_04_03` }
      ];
      
      for (const { date, storageKey } of issueDates) {
        if (!localStorage.getItem(storageKey)) {
          console.log(`StatsSection: Specifically processing ${date}`);
          const result = await processPendingAttendance(date);
          
          if (result > 0) {
            toast.success(`Fixed ${result} attendance records for ${date}`);
          }
          
          localStorage.setItem(storageKey, 'true');
        }
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      console.log(`StatsSection: Checking if we need to process pending attendance for ${yesterdayString}`);
      
      const storageKey = `attendance_processed_${yesterdayString}`;
      const processedToday = localStorage.getItem(`${storageKey}_${todayString}`);
      
      if (processedToday) {
        console.log(`StatsSection: Already processed pending attendance for ${yesterdayString} today`);
      } else {
        const markedCount = await markPendingAsAbsent(yesterdayString);
        
        if (markedCount > 0) {
          toast.success(`${markedCount} students marked as absent for yesterday (${yesterdayString})`);
        } else {
          console.log(`StatsSection: No pending attendance to process for ${yesterdayString}`);
        }
        
        localStorage.setItem(`${storageKey}_${todayString}`, 'true');
      }
      
      lastProcessDateRef.current = todayString;
      
    } catch (error) {
      console.error('Error processing attendance:', error);
    } finally {
      processingRef.current = false;
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    const updateStats = async () => {
      if (!isMounted.current) return;
      
      try {
        const statsData = await fetchStats();
        
        if (isMounted.current) {
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error updating stats:', error);
      }
    };
    
    updateStats();
    
    setTimeout(() => {
      processAttendance();
    }, 3000);
    
    setTimeout(async () => {
      try {
        const clearedCount = await clearAutomatedNotesForPresentStudents();
        if (clearedCount > 0) {
          console.log(`Cleared automated absence notes for ${clearedCount} students who are present today`);
          toast.success(`Updated ${clearedCount} attendance records`);
        }
      } catch (error) {
        console.error('Error clearing automated notes:', error);
      }
    }, 5000);
    
    const unsubscribe = subscribeToAttendanceChanges(() => {
      console.log('Attendance change detected in StatsSection, refreshing stats');
      updateStats();
    });
    
    const refreshInterval = setInterval(updateStats, 300000);
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 10, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const midnightCheck = setTimeout(() => {
      lastProcessDateRef.current = null;
      
      processAttendance();
      
      const nextMidnightCheck = setInterval(() => {
        lastProcessDateRef.current = null;
        
        processAttendance();
      }, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(nextMidnightCheck);
    }, timeUntilMidnight);
    
    return () => {
      isMounted.current = false;
      clearInterval(refreshInterval);
      clearTimeout(midnightCheck);
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex space-x-4 justify-center md:justify-start">
      <StatCard 
        icon={<Users size={20} />}
        value={stats.totalBuilders}
        label="Enrolled Builders"
      />
      
      <StatCard 
        icon={<CheckCircle size={20} />}
        value={`${stats.attendanceRate}%`}
        label="Attendance Today"
      />
    </div>
  );
};

export default StatsSection;
