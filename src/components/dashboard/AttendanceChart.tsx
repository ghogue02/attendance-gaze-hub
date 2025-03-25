
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
import { Builder } from '@/components/builder/types';
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
        // Calculate the date range - we want the most recent days
        const endDate = new Date(); // Today
        
        // Format date for logging
        const formatDateForLog = (date: Date) => {
          return date.toISOString().split('T')[0];
        };
        
        console.log(`Fetching attendance chart data with end date: ${formatDateForLog(endDate)}`);
        
        // Fetch ALL attendance data without limiting to a date range
        // This ensures we get all historical data including imported records
        const { data: attendanceData, error } = await supabase
          .from('attendance')
          .select('*')
          .order('date', { ascending: false });
          
        if (error) {
          console.error('Error fetching historical attendance:', error);
          toast.error('Failed to load attendance history');
          setIsLoading(false);
          return;
        }
        
        console.log('Raw attendance data fetched for chart:', attendanceData?.length || 0, 'records');
        
        if (!attendanceData || attendanceData.length === 0) {
          setChartData([]);
          setIsLoading(false);
          return;
        }
        
        // Create a map to aggregate attendance by date
        const dateMap = new Map<string, { Present: number; Absent: number; Excused: number; Late: number }>();
        
        // Process all attendance records
        attendanceData.forEach(record => {
          const dateStr = record.date;
          
          if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, {
              Present: 0,
              Absent: 0,
              Excused: 0,
              Late: 0
            });
          }
          
          const dateStats = dateMap.get(dateStr)!;
          
          // Map the status properly
          if (record.status === 'present') {
            dateStats.Present++;
          } else if (record.status === 'absent' && record.excuse_reason) {
            dateStats.Excused++;
          } else if (record.status === 'absent') {
            dateStats.Absent++;
          } else if (record.status === 'excused') {
            dateStats.Excused++;
          } else if (record.status === 'late') {
            dateStats.Late++;
          }
        });
        
        // Convert the map to an array of chart data objects
        let formattedData: DailyAttendance[] = Array.from(dateMap.entries()).map(([dateStr, counts]) => {
          // Parse the date to create a proper display format
          const dateParts = dateStr.split('-');
          if (dateParts.length === 3) {
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // JS months are 0-based
            const day = parseInt(dateParts[2]);
            
            const date = new Date(year, month, day);
            const dayNum = date.getDate().toString().padStart(2, '0');
            const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
            
            return {
              name: `${dayNum} ${dayOfWeek}`,
              date: dateStr,
              Present: counts.Present,
              Absent: counts.Absent,
              Excused: counts.Excused,
              Late: counts.Late
            };
          }
          
          // Fallback for any invalid dates
          return {
            name: dateStr,
            date: dateStr,
            Present: counts.Present,
            Absent: counts.Absent,
            Excused: counts.Excused,
            Late: counts.Late
          };
        });
        
        // Sort by date (most recent first)
        formattedData.sort((a, b) => a.date.localeCompare(b.date));
        
        // Take only the latest 'days' entries if we have more than we need
        if (formattedData.length > days) {
          formattedData = formattedData.slice(-days);
        }
        
        console.log('Prepared chart data:', formattedData);
        setChartData(formattedData);
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
