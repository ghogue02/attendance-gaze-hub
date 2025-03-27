import { Users, CheckCircle, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { processHistoricalAttendance } from '@/utils/attendance/markAttendance';

export const StatsSection = () => {
  const [stats, setStats] = useState({
    totalBuilders: 0,
    attendanceRate: 0
  });
  const [isHistoricalDialogOpen, setIsHistoricalDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Function to mark all pending students as absent
  const markPendingAsAbsent = async (date: string) => {
    try {
      console.log(`Checking for pending students on ${date} to mark as absent`);
      
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
      
      const storageKey = `attendance_processed_${yesterdayString}`;
      const alreadyProcessed = localStorage.getItem(storageKey);
      
      if (alreadyProcessed) {
        console.log(`Already processed pending attendance for ${yesterdayString}`);
        return;
      }
      
      await markPendingAsAbsent(yesterdayString);
      
      localStorage.setItem(storageKey, 'true');
      
    } catch (error) {
      console.error('Error checking previous day attendance:', error);
    }
  };
  
  // New function to handle historical data processing
  const handleHistoricalProcess = async (startDateStr: string, endDateStr: string) => {
    try {
      setIsProcessing(true);
      console.log(`Processing historical attendance from ${startDateStr} to ${endDateStr}`);
      
      const result = await processHistoricalAttendance(startDateStr, endDateStr);
      
      toast.success(`Historical attendance processed: Updated ${result.updated} pending records and created ${result.created} absent records`);
      setIsHistoricalDialogOpen(false);
      
    } catch (error) {
      console.error('Error processing historical attendance:', error);
      toast.error('Failed to process historical attendance');
    } finally {
      setIsProcessing(false);
    }
  };
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: totalBuilders, error: buildersError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });
          
        if (buildersError) {
          console.error('Error fetching builders count:', buildersError);
          return;
        }
        
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
    
    fetchStats();
    
    checkPreviousDay();
    
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
      
    const refreshInterval = setInterval(fetchStats, 60000);
    
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
      clearInterval(refreshInterval);
      clearTimeout(midnightCheck);
      supabase.removeChannel(attendanceChannel);
    };
  }, []);

  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

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

      <div className="glass-card p-4 flex-1 flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <Calendar size={20} />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs mt-1"
          onClick={() => {
            setStartDate(getDefaultStartDate());
            setEndDate(new Date().toISOString().split('T')[0]);
            setIsHistoricalDialogOpen(true);
          }}
        >
          Process Historical
        </Button>
        <span className="text-xs text-muted-foreground mt-1">Attendance</span>
      </div>

      <Dialog open={isHistoricalDialogOpen} onOpenChange={setIsHistoricalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Historical Attendance</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This will mark all pending attendance as absent and create absent records for students with no attendance record for the specified date range.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="text-sm font-medium">
                  Start Date
                </label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="end-date" className="text-sm font-medium">
                  End Date
                </label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsHistoricalDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleHistoricalProcess(startDate, endDate)}
              disabled={isProcessing || !startDate || !endDate}
            >
              {isProcessing ? 'Processing...' : 'Process'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
