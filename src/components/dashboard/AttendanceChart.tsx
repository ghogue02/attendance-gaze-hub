
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
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (days - 1));
        
        // Format dates for query, avoiding timezone issues
        const formatDateForQuery = (date: Date) => {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };
        
        const startDateStr = formatDateForQuery(startDate);
        const endDateStr = formatDateForQuery(endDate);
        
        console.log(`Fetching attendance chart data from ${startDateStr} to ${endDateStr}`);
        
        // Fetch attendance data 
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
        
        console.log('Raw attendance data fetched for chart:', attendanceData?.length || 0, 'records', attendanceData);
        
        // Initialize day-by-day data structure
        const dateMap: Record<string, DailyAttendance> = {};
        
        // Initialize the date range with zeros
        for (let i = 0; i < days; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          
          // Format date string
          const formatDateString = (date: Date) => {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          };
          
          const dateStr = formatDateString(date);
          
          // Create display format for chart x-axis (DD Day)
          const dayNum = date.getDate().toString().padStart(2, '0');
          const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
          const dayStr = `${dayNum} ${dayOfWeek}`;
          
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
            // Use the date directly from the record
            const dateStr = record.date;
            
            if (dateMap[dateStr]) {
              let status = 'Absent'; // Default status
              
              // Debug this record
              console.log('Processing chart record:', {
                date: dateStr,
                status: record.status,
                excuse_reason: record.excuse_reason,
                student_id: record.student_id
              });
              
              // Handle different status formats and excuse reasons
              if (record.status === 'present') {
                status = 'Present';
              } else if (record.status === 'absent' && record.excuse_reason) {
                status = 'Excused';
              } else if (record.status === 'absent') {
                status = 'Absent';
              } else if (record.status === 'excused') {
                status = 'Excused';
              } else if (record.status === 'late') {
                status = 'Late';
              }
              
              // Increment the counter for this status
              dateMap[dateStr][status as keyof Omit<DailyAttendance, 'name' | 'date'>] += 1;
            } else {
              console.log(`Date ${dateStr} not in range for chart display`);
            }
          });
        }
        
        // Convert the map to an array for the chart
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
