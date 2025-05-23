
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { DailyAttendance } from '@/hooks/useAttendanceChartData';
import { parseAsUTC } from '@/utils/date/dateUtils';
import { isClassDaySync } from '@/utils/attendance/isClassDay';

const HOLIDAY_DATES = new Set([
  '2025-04-20' // Easter Sunday
]);

interface AttendanceBarChartProps {
  chartData: DailyAttendance[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0]?.payload;
    
    return (
      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow border border-border">
        <p className="font-semibold">{label}</p>
        <p className="text-[#4ade80]">Present: {dataItem?.Present}</p>
        <p className="text-[#60a5fa]">Late: {dataItem?.Late}</p>
        <p className="text-[#f87171]">Absent: {dataItem?.Absent}</p>
        <p className="text-[#facc15]">Excused: {dataItem?.Excused}</p>
        <p className="text-muted-foreground text-xs">{dataItem?.date}</p>
      </div>
    );
  }
  return null;
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
  
  // Use the chart data directly since it's already filtered by the hook
  // The hook now excludes Fridays, Thursdays and holidays
  const filteredData = chartData;
  
  const apr1Data = filteredData.find(d => d.date === '2025-04-01');
  const apr2Data = filteredData.find(d => d.date === '2025-04-02');
  const apr3Data = filteredData.find(d => d.date === '2025-04-03');
  console.log('Bar chart April 1 data:', apr1Data);
  console.log('Bar chart April 2 data:', apr2Data);
  console.log('Bar chart April 3 data:', apr3Data);
  
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No attendance data available (after filtering)</p>
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
        <Tooltip content={<CustomTooltip />} />
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
