
import { Users, CheckCircle } from 'lucide-react';

export const StatsSection = () => {
  // Simulated stats for the UI
  const stats = [
    { label: 'Enrolled Builders', value: '248', icon: <Users size={20} /> },
    { label: 'Attendance Today', value: '86%', icon: <CheckCircle size={20} /> },
  ];

  return (
    <div className="flex space-x-4 justify-center md:justify-start">
      {stats.map((stat) => (
        <div 
          key={stat.label} 
          className="glass-card p-4 flex-1 flex flex-col items-center"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
            {stat.icon}
          </div>
          <span className="text-2xl font-bold">{stat.value}</span>
          <span className="text-xs text-muted-foreground">{stat.label}</span>
        </div>
      ))}
    </div>
  );
};
