
import { Users, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const StatsSection = () => {
  const [stats, setStats] = useState({
    totalBuilders: 0,
    attendanceRate: 0
  });
  
  // Function to mark all pending students as absent
  const markPendingAsAbsent = async (date: string) => {
    try {
      console.log(`Checking for pending students on ${date} to mark as absent`);
      
      // Find all students with pending status for the given date
      const { data: pendingAttendance, error: fetchError } = await supabase
        .from('attendance')
        .select('id, student_id')
        .eq('date', date)
        .eq('status', 'pending');
        
      if (fetchError) {
        console.error('Error fetching pending attendance:', fetchError);
        return;
      }
      
      if (!pendingAttendance || pendingAttendance.length === 0) {
        console.log('No pending attendance records found for date:', date);
        return;
      }
      
      console.log(`Found ${pendingAttendance.length} pending students to mark as absent`);
      
      // Update all pending records to absent
      const { error: updateError } = await supabase
        .from('attendance')
        .update({ 
          status: 'absent',
          time_recorded: new Date().toISOString(),
          notes: 'Automatically marked as absent (end of day)'
        })
        .in('id', pendingAttendance.map(record => record.id));
        
      if (updateError) {
        console.error('Error marking pending as absent:', updateError);
        return;
      }
      
      console.log(`Successfully marked ${pendingAttendance.length} students as absent`);
      toast.success(`${pendingAttendance.length} pending students marked as absent`);
      
    } catch (error) {
      console.error('Error in markPendingAsAbsent:', error);
    }
  };
  
  // Check if we need to mark students absent from previous day
  const checkPreviousDay = async () => {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      console.log(`Checking if we need to process pending attendance for ${yesterdayString}`);
      
      // Check if we've already run this process for yesterday
      const storageKey = `attendance_processed_${yesterdayString}`;
      const alreadyProcessed = localStorage.getItem(storageKey);
      
      if (alreadyProcessed) {
        console.log(`Already processed pending attendance for ${yesterdayString}`);
        return;
      }
      
      // Mark pending as absent for yesterday
      await markPendingAsAbsent(yesterdayString);
      
      // Mark as processed in localStorage
      localStorage.setItem(storageKey, 'true');
      
    } catch (error) {
      console.error('Error checking previous day attendance:', error);
    }
  };
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total number of builders
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
        
        const presentCount = attendanceData?.filter(record => 
          record.status === 'present'
        ).length || 0;
        
        // Calculate attendance rate
        const attendanceRate = totalBuilders ? 
          Math.round((presentCount / totalBuilders) * 100) : 0;
          
        console.log('Stats updated:', {
          totalBuilders,
          presentCount,
          attendanceRate
        });
          
        setStats({
          totalBuilders: totalBuilders || 0,
          attendanceRate
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    // Fetch stats initially
    fetchStats();
    
    // Check for previous day's pending attendance
    checkPreviousDay();
    
    // Set up a subscription to the attendance table
    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance' }, 
        () => {
          console.log('Attendance change detected, refreshing stats');
          fetchStats();
        }
      )
      .subscribe();
      
    // Refresh stats every minute as a fallback
    const refreshInterval = setInterval(fetchStats, 60000);
    
    // Set up a daily check at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 1, 0); // Just after midnight
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Schedule the check for midnight
    const midnightCheck = setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      markPendingAsAbsent(today);
      
      // Reschedule for the next day
      const nextMidnightCheck = setInterval(() => {
        const currentDate = new Date().toISOString().split('T')[0];
        markPendingAsAbsent(currentDate);
      }, 24 * 60 * 60 * 1000); // Check every 24 hours
      
      return () => clearInterval(nextMidnightCheck);
    }, timeUntilMidnight);
    
    return () => {
      clearInterval(refreshInterval);
      clearTimeout(midnightCheck);
      supabase.removeChannel(attendanceChannel);
    };
  }, []);

  return (
    <div className="flex space-x-4 justify-center md:justify-start">
      <div className="glass-card p-4 flex-1 flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <Users size={20} />
        </div>
        <span className="text-2xl font-bold">{stats.totalBuilders}</span>
        <span className="text-xs text-muted-foreground">Enrolled Builders</span>
      </div>
      
      <div className="glass-card p-4 flex-1 flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <CheckCircle size={20} />
        </div>
        <span className="text-2xl font-bold">{stats.attendanceRate}%</span>
        <span className="text-xs text-muted-foreground">Attendance Today</span>
      </div>
    </div>
  );
};
