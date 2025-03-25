
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
        
        // Fetch all attendance data directly without limiting to a date range
        // This ensures we get all historical data
        const { data: attendanceData, error } = await supabase
          .from('attendance')
          .select('*')
          .order('date', { ascending: true });
          
        if (error) {
          console.error('Error fetching historical attendance:', error);
          toast.error('Failed to load attendance history');
          setIsLoading(false);
          return;
        }
        
        console.log('Raw attendance data fetched for chart:', attendanceData?.length || 0, 'records');
        
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
          // Create a map of all dates in the data for easier lookup
          const allDatesMap = new Map();
          
          // Group records by date for statistical counting
          attendanceData.forEach(record => {
            const dateStr = record.date;
            if (!allDatesMap.has(dateStr)) {
              allDatesMap.set(dateStr, {
                Present: 0,
                Absent: 0,
                Excused: 0,
                Late: 0
              });
            }
            
            const dateStats = allDatesMap.get(dateStr);
            
            // Determine the status for this record
            let status = 'Absent'; // Default status
            
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
            dateStats[status]++;
          });
          
          // Now populate our date range with the actual data
          // or create new entries for dates that aren't in our initial range
          allDatesMap.forEach((stats, dateStr) => {
            // For dates within our display range, update the existing entry
            if (dateMap[dateStr]) {
              dateMap[dateStr].Present = stats.Present;
              dateMap[dateStr].Absent = stats.Absent;
              dateMap[dateStr].Excused = stats.Excused;
              dateMap[dateStr].Late = stats.Late;
            } 
            // For historical dates outside our range, add them only if they have data
            else if (stats.Present > 0 || stats.Absent > 0 || stats.Excused > 0 || stats.Late > 0) {
              try {
                // Parse the date string to create a proper date object
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                
                // Create a new entry for this historical date
                const dayNum = date.getDate().toString().padStart(2, '0');
                const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
                const dayStr = `${dayNum} ${dayOfWeek}`;
                
                dateMap[dateStr] = {
                  name: dayStr,
                  date: dateStr,
                  Present: stats.Present,
                  Absent: stats.Absent,
                  Excused: stats.Excused,
                  Late: stats.Late
                };
              } catch (e) {
                console.error('Error parsing date:', e, dateStr);
              }
            }
          });
        }
        
        // Convert the map to an array and sort by date for the chart
        const resultData = Object.values(dateMap)
          .sort((a, b) => a.date.localeCompare(b.date))
          // Take only the last 'days' entries if we have more than we need
          .slice(-days);
          
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
