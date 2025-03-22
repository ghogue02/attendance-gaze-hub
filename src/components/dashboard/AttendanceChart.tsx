
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

interface AttendanceChartProps {
  builders: Builder[];
  days?: number;
}

const AttendanceChart = ({ builders, days = 7 }: AttendanceChartProps) => {
  // Generate dummy data for historical view (since we don't have actual historical data)
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    // Create a record for each of the last 'days' days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Format date as "Mon 01" for x-axis
      const dayStr = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        day: '2-digit'
      });
      
      // For historical days, generate random attendance data
      // For today, use actual data
      const isToday = i === 0;
      const totalCount = builders.length;
      
      // Use actual data for today, generate synthetic data for past days
      const presentCount = isToday 
        ? builders.filter(b => b.status === 'present').length
        : Math.floor(Math.random() * (totalCount * 0.8)) + Math.floor(totalCount * 0.6);
      
      const absentCount = isToday 
        ? builders.filter(b => b.status === 'absent').length
        : Math.floor(Math.random() * (totalCount * 0.2));
      
      const excusedCount = isToday 
        ? builders.filter(b => b.status === 'excused').length
        : Math.floor(Math.random() * (totalCount * 0.1));
      
      const lateCount = Math.max(0, totalCount - presentCount - absentCount - excusedCount);
      
      data.push({
        name: dayStr,
        Present: presentCount,
        Absent: absentCount,
        Excused: excusedCount,
        Late: lateCount,
      });
    }
    
    return data;
  }, [builders, days]);

  return (
    <div className="glass-card p-6 w-full h-80">
      <h3 className="text-lg font-semibold mb-4">Attendance Trend ({days} Days)</h3>
      <ResponsiveContainer width="100%" height="85%">
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
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;
