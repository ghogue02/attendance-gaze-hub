
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
  
  // Log the chart data for debugging
  console.log("Chart data to be rendered:", chartData.map(d => `${d.date} (${d.name})`));
  
  return (
    <ResponsiveContainer width="100%" height="100%">
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
        <Bar dataKey="Present" stackId="attendance" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Late" stackId="attendance" fill="#60a5fa" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Absent" fill="#f87171" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Excused" fill="#facc15" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceBarChart;
