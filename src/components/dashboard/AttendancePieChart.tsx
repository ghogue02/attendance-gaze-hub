
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Builder } from '@/components/builder/types';

interface AttendancePieChartProps {
  builders: Builder[];
}

const AttendancePieChart = ({ builders }: AttendancePieChartProps) => {
  // Calculate attendance statistics
  const presentCount = builders.filter(s => s.status === 'present').length;
  const absentCount = builders.filter(s => s.status === 'absent').length;
  const excusedCount = builders.filter(s => s.status === 'excused').length;
  const pendingCount = builders.filter(s => s.status === 'pending').length;
  
  const data = [
    { name: 'Present', value: presentCount, color: '#4ade80' },
    { name: 'Absent', value: absentCount, color: '#f87171' },
    { name: 'Excused', value: excusedCount, color: '#facc15' },
    { name: 'Pending', value: pendingCount, color: '#94a3b8' },
  ].filter(item => item.value > 0); // Only show statuses that have at least one builder
  
  return (
    <div className="glass-card p-6 w-full">
      <h3 className="text-lg font-semibold mb-4">Today's Attendance Breakdown</h3>
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
    </div>
  );
};

export default AttendancePieChart;
