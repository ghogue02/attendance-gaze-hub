
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
import { DailyAttendance } from '@/hooks/useAttendanceChartData';

interface AttendanceBarChartProps {
  chartData: DailyAttendance[];
  isLoading: boolean;
}

// Parse a date string as UTC
const parseAsUTC = (dateStr: string): Date => {
  return new Date(dateStr + 'T00:00:00Z');
};

const AttendanceBarChart = ({ chartData, isLoading }: AttendanceBarChartProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading chart data...</p>
      </div>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No attendance data available</p>
      </div>
    );
  }
  
  // Additional filter to ensure no Friday data is displayed using UTC day check
  const filteredData = chartData.filter(item => {
    const date = parseAsUTC(item.date);
    return date.getUTCDay() !== 5; // Filter out Fridays (5) using UTC
  });
  
  // Log the chart data for debugging with UTC day info
  console.log("Chart data to be rendered:", filteredData.map(d => {
    const date = parseAsUTC(d.date);
    return `${d.date} (${d.name}, UTC Day: ${date.getUTCDay()})`;
  }));
  
  // If after filtering Fridays we have no data, show empty state
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No attendance data available (after filtering out Fridays)</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={filteredData}
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
        <Bar dataKey="Present" stackId="attendance" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Late" stackId="attendance" fill="#60a5fa" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Absent" fill="#f87171" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Excused" fill="#facc15" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceBarChart;
