
import { Users, CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { StatCard } from './';
import { 
  markPendingAsAbsent, 
  processAttendanceForDate, 
  subscribeToAttendanceChanges, 
  fetchStats,
  processSpecificDateIssues,
  processPendingAttendance 
} from '@/services/attendanceService';

export const StatsSection = () => {
  const [stats, setStats] = useState({
    totalBuilders: 0,
    attendanceRate: 0
  });
  const isMounted = useRef(true);
  
  // Check if we need to process specific dates or mark students absent from previous day
  const processAttendance = async () => {
    try {
      // First process specific problematic dates, including 3/31/2025
      await processSpecificDateIssues();
      
      // Specifically check for 3/31/2025 and make sure it's processed
      const march31_2025 = '2025-03-31';
      const march31StorageKey = `fix_applied_${march31_2025.replace(/-/g, '_')}`;
      
      if (!localStorage.getItem(march31StorageKey)) {
        console.log(`StatsSection: Specifically processing 3/31/2025`);
        const result = await processPendingAttendance(march31_2025);
        
        if (result > 0) {
          toast.success(`Fixed ${result} attendance records for March 31, 2025`);
        }
        
        // Mark as processed
        localStorage.setItem(march31StorageKey, 'true');
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
        const statsData = await fetchStats();
        
        if (isMounted.current) {
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error updating stats:', error);
      }
    };
    
    updateStats();
    
    // Process attendance issues and previous day's pending records
    processAttendance();
    
    // Subscribe to attendance changes using the shared subscription service
    const unsubscribe = subscribeToAttendanceChanges(() => {
      console.log('Attendance change detected in StatsSection, refreshing stats');
      updateStats();
    });
    
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
