
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Builder } from '@/components/builder/types';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AttendancePieChartProps {
  builders: Builder[];
}

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');

const AttendancePieChart = ({ builders }: AttendancePieChartProps) => {
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchTodayData = async () => {
      setIsLoading(true);
      
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        const todayDate = new Date(today);
        
        // Skip processing if today is a Friday
        if (todayDate.getDay() === 5) {
          setData([]);
          setIsLoading(false);
          return;
        }
        
        // Skip if today is before the minimum date
        if (todayDate < MINIMUM_DATE) {
          setData([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch attendance records for today
        const { data: attendanceRecords, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('date', today);
          
        if (error) {
          console.error('Error fetching today\'s attendance for pie chart:', error);
          toast.error('Failed to load today\'s attendance breakdown');
          setIsLoading(false);
          return;
        }
        
        console.log(`Fetched ${attendanceRecords?.length || 0} attendance records for pie chart (date: ${today})`);
        
        // Calculate attendance statistics
        let presentCount = 0;
        let absentCount = 0;
        let excusedCount = 0;
        let pendingCount = 0;
        let lateCount = 0;
        
        if (attendanceRecords && attendanceRecords.length > 0) {
          attendanceRecords.forEach(record => {
            if (record.status === 'present') {
              presentCount++;
            } else if (record.status === 'absent' && record.excuse_reason) {
              excusedCount++;
            } else if (record.status === 'absent') {
              absentCount++;
            } else if (record.status === 'excused') {
              excusedCount++;
            } else if (record.status === 'late') {
              lateCount++;
            } else if (record.status === 'pending') {
              pendingCount++;
            }
          });
        } else {
          // Use builders data as fallback if no attendance records exist
          presentCount = builders.filter(s => s.status === 'present').length;
          absentCount = builders.filter(s => s.status === 'absent' && !s.excuseReason).length;
          excusedCount = builders.filter(s => (s.status === 'excused' || (s.status === 'absent' && s.excuseReason))).length;
          pendingCount = builders.filter(s => s.status === 'pending').length;
          lateCount = builders.filter(s => s.status === 'late').length;
        }
        
        // Prepare data for pie chart
        const chartData = [
          { name: 'Present', value: presentCount, color: '#4ade80' },
          { name: 'Absent', value: absentCount, color: '#f87171' },
          { name: 'Excused', value: excusedCount, color: '#facc15' },
          { name: 'Pending', value: pendingCount, color: '#94a3b8' },
          { name: 'Late', value: lateCount, color: '#60a5fa' },
        ].filter(item => item.value > 0); // Only show statuses that have at least one builder
        
        console.log('Pie chart data prepared:', chartData);
        setData(chartData);
      } catch (error) {
        console.error('Error preparing pie chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTodayData();
  }, [builders]);
  
  return (
    <div className="glass-card p-6 w-full">
      <h3 className="text-lg font-semibold mb-4">Today's Attendance Breakdown</h3>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No attendance data available for today</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} builders`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AttendancePieChart;
