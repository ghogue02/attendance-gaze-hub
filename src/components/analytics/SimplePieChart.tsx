
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SimplePieChartProps {
  data: {
    totalPresent: number;
    totalLate: number;
    totalAbsent: number;
    totalExcused: number;
  };
}

const COLORS = {
  Present: '#4ade80',
  Late: '#60a5fa',
  Absent: '#f87171',
  Excused: '#facc15'
};

const SimplePieChart = ({ data }: SimplePieChartProps) => {
  const pieData = [
    { name: 'Present', value: data.totalPresent, color: COLORS.Present },
    { name: 'Late', value: data.totalLate, color: COLORS.Late },
    { name: 'Absent', value: data.totalAbsent, color: COLORS.Absent },
    { name: 'Excused', value: data.totalExcused, color: COLORS.Excused },
  ].filter(item => item.value > 0);

  if (pieData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No attendance data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} records`, 'Count']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SimplePieChart;
