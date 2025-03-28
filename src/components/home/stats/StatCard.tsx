
import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  action?: ReactNode;
}

const StatCard = ({ icon, value, label, action }: StatCardProps) => {
  return (
    <div className="glass-card p-4 flex-1 flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
        {icon}
      </div>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};

export default StatCard;
