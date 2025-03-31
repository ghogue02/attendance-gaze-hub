
import { Users, CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from './';
import { markPendingAsAbsent, processAttendanceForDate } from '@/services/attendanceService';

export const StatsSection = () => {
  const [stats, setStats] = useState({
    totalBuilders: 0,
    attendanceRate: 0
  });
  const isMounted = useRef(true);
  
  // Check if we need to process specific dates or mark students absent from previous day
  const processAttendance = async () => {
    try {
      // Process specific dates with known issues
      const datesToProcess = [
        { date: '2025-03-29', storageKey: 'home_march_29_2025_fix_applied' },
        { date: '2025-03-30', storageKey: 'home_march_30_2025_fix_applied' }
      ];
      
      for (const { date, storageKey } of datesToProcess) {
        if (!localStorage.getItem(storageKey)) {
          console.log(`StatsSection: Processing attendance for ${date} - not yet processed`);
          const result = await processAttendanceForDate(date);
          
          if (result > 0) {
            toast.success(`Fixed ${result} attendance records for ${date}`);
          }
          
          // Mark as processed
          localStorage.setItem(storageKey, 'true');
        }
      }
      
      // Also check previous day
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      console.log(`StatsSection: Checking if we need to process pending attendance for ${yesterdayString}`);
      
      // Use a storage key with a timestamp that will force processing once per day
      const storageKey = `attendance_processed_${yesterdayString}`;
      const todayDateString = today.toISOString().split('T')[0];
      const processedToday = localStorage.getItem(`${storageKey}_${todayDateString}`);
      
      if (processedToday) {
        console.log(`StatsSection: Already processed pending attendance for ${yesterdayString} today`);
        return;
      }
      
      // Process yesterday's pending attendance
      const markedCount = await markPendingAsAbsent(yesterdayString);
      
      if (markedCount > 0) {
        toast.success(`${markedCount} students marked as absent for yesterday (${yesterdayString})`);
      } else {
        console.log(`StatsSection: No pending attendance to process for ${yesterdayString}`);
      }
      
      // Store that we've processed today with today's date to ensure it runs once per day
      localStorage.setItem(`${storageKey}_${todayDateString}`, 'true');
      
    } catch (error) {
      console.error('Error processing attendance:', error);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    const updateStats = async () => {
      if (!isMounted.current) return;
      
      try {
        // Fetch total builders count
        const { count: totalBuilders, error: buildersError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });
          
        if (buildersError) {
          console.error('Error fetching builders count:', buildersError);
          return;
        }
        
        // Fetch today's attendance
        const today = new Date().toISOString().split('T')[0];
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('date', today);
          
        if (attendanceError) {
          console.error('Error fetching attendance:', attendanceError);
          return;
        }
        
        // Calculate attendance rate
        const presentCount = attendanceData?.filter(record => 
          record.status === 'present'
        ).length || 0;
        
        const attendanceRate = totalBuilders ? 
          Math.round((presentCount / totalBuilders) * 100) : 0;
          
        if (isMounted.current) {
          setStats({
            totalBuilders: totalBuilders || 0,
            attendanceRate
          });
        }
      } catch (error) {
        console.error('Error updating stats:', error);
      }
    };
    
    updateStats();
    
    // Process attendance issues and previous day's pending records
    processAttendance();
    
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
    
    // Set up midnight check
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

