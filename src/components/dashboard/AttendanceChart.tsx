import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Builder } from '@/components/BuilderCard';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface AttendanceChartProps {
  builders: Builder[];
  days?: number;
}

interface DailyAttendance {
  name: string;
  date: string;
  Present: number;
  Absent: number;
  Excused: number;
  Late: number;
}

const AttendanceChart = ({ builders, days = 7 }: AttendanceChartProps) => {
  const [chartData, setChartData] = useState<DailyAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      
      try {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - (days - 1));
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = today.toISOString().split('T')[0];
        
        console.log(`Fetching attendance from ${startDateStr} to ${endDateStr}`);
        
        // Fetch attendance data for the date range
        const { data: attendanceData, error } = await supabase
          .from('attendance')
          .select('*')
          .gte('date', startDateStr)
          .lte('date', endDateStr)
          .order('date', { ascending: true });
          
        if (error) {
          console.error('Error fetching historical attendance:', error);
          toast.error('Failed to load attendance history');
          setIsLoading(false);
          return;
        }
        
        console.log('Attendance data fetched:', attendanceData?.length || 0, 'records');
        
        // Create a map of dates in the range
        const dateMap: Record<string, DailyAttendance> = {};
        
        // Initialize the date range with zeros
        for (let i = 0; i < days; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          
          // Format date as "DD Day" for x-axis
          const dayStr = format(date, 'dd EEE');
          
          dateMap[dateStr] = {
            name: dayStr,
            date: dateStr,
            Present: 0,
            Absent: 0,
            Excused: 0,
            Late: 0
          };
        }
        
        // Fill in the actual attendance data
        if (attendanceData && attendanceData.length > 0) {
          attendanceData.forEach(record => {
            // Make sure we handle all date formats
            const dateStr = typeof record.date === 'string' 
              ? record.date.split('T')[0] 
              : new Date(record.date).toISOString().split('T')[0];
            
            if (dateMap[dateStr]) {
              let status = record.status.charAt(0).toUpperCase() + record.status.slice(1);
              
              // Map excused absence to the Excused category for the chart
              if (record.excuse_reason && status === 'Absent') {
                status = 'Excused';
              } else if (status === 'Present' || status === 'Absent' || status === 'Excused' || status === 'Late') {
                // Keep status as is
              } else {
                // Default to Absent for any other status
                status = 'Absent';
              }
              
              // Increment the counter for this status
              if (status === 'Present' || status === 'Absent' || status === 'Excused' || status === 'Late') {
                dateMap[dateStr][status as keyof Omit<DailyAttendance, 'name' | 'date'>] += 1;
              }
            }
          });
        }
        
        // Convert the map to an array
        const resultData = Object.values(dateMap);
        console.log('Prepared chart data:', resultData);
        setChartData(resultData);
      } catch (error) {
        console.error('Error preparing chart data:', error);
        toast.error('Error loading attendance chart');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistoricalData();
  }, [days]);

  return (
    <div className="glass-card p-6 w-full h-80">
      <h3 className="text-lg font-semibold mb-4">Attendance Trend ({days} Days)</h3>
      <ResponsiveContainer width="100%" height="85%">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No attendance data available</p>
          </div>
        ) : (
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Present" fill="#4ade80" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Absent" fill="#f87171" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Excused" fill="#facc15" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Late" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;
