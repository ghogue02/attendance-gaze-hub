
import { Users, CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from './';
import { markPendingAsAbsent, fetchStats } from '@/services/attendanceService';

export const StatsSection = () => {
  const [stats, setStats] = useState({
    totalBuilders: 0,
    attendanceRate: 0
  });
  const isMounted = useRef(true);
  
  // Check if we need to mark students absent from previous day
  const checkPreviousDay = async () => {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      console.log(`Checking if we need to process pending attendance for ${yesterdayString}`);
      
      const storageKey = `attendance_processed_${yesterdayString}`;
      const alreadyProcessed = localStorage.getItem(storageKey);
      
      if (alreadyProcessed) {
        console.log(`Already processed pending attendance for ${yesterdayString}`);
        return;
      }
      
      const markedCount = await markPendingAsAbsent(yesterdayString);
      
      if (markedCount > 0) {
        toast.success(`${markedCount} pending students marked as absent for yesterday`);
      }
      
      localStorage.setItem(storageKey, 'true');
      
    } catch (error) {
      console.error('Error checking previous day attendance:', error);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    const updateStats = async () => {
      if (!isMounted.current) return;
      const newStats = await fetchStats();
      if (isMounted.current) {
        setStats(newStats);
      }
    };
    
    updateStats();
    checkPreviousDay();
    
    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance' }, 
        () => {
          console.log('Attendance change detected, refreshing stats');
          updateStats();
        }
      )
      .subscribe();
      
    const refreshInterval = setInterval(updateStats, 60000);
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 1, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const midnightCheck = setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      markPendingAsAbsent(today);
      
      const nextMidnightCheck = setInterval(() => {
        const currentDate = new Date().toISOString().split('T')[0];
        markPendingAsAbsent(currentDate);
      }, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(nextMidnightCheck);
    }, timeUntilMidnight);
    
    return () => {
      isMounted.current = false;
      clearInterval(refreshInterval);
      clearTimeout(midnightCheck);
      supabase.removeChannel(attendanceChannel);
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
