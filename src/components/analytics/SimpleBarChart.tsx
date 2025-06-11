
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SimpleBarChartProps {
  data: Array<{
    date: string;
    present: number;
    late: number;
    absent: number;
    excused: number;
  }>;
}

const SimpleBarChart = ({ data }: SimpleBarChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No attendance data available for the selected period</p>
      </div>
    );
  }

  // Format data for display - use the existing name from the processed data
  const chartData = data.map(item => ({
    name: item.name || `${new Date(item.date).getDate()}`, // Fallback if name is missing
    Present: item.present,
    Late: item.late,
    Absent: item.absent,
    Excused: item.excused,
    date: item.date
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          labelFormatter={(label, payload) => {
            const item = payload?.[0]?.payload;
            return item ? `${label} (${item.date})` : label;
          }}
        />
        <Legend />
        <Bar dataKey="Present" stackId="attendance" fill="#4ade80" />
        <Bar dataKey="Late" stackId="attendance" fill="#60a5fa" />
        <Bar dataKey="Absent" fill="#f87171" />
        <Bar dataKey="Excused" fill="#facc15" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SimpleBarChart;
