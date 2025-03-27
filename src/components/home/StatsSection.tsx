import { Users, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const StatsSection = () => {
  const [stats, setStats] = useState({
    totalBuilders: 0,
    attendanceRate: 0
  });
  
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
    
    return () => {
      clearInterval(refreshInterval);
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
