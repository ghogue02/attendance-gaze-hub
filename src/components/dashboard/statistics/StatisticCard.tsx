
import { motion } from 'framer-motion';

interface StatisticCardProps {
  title: string;
  value: number | string;
  color: string;
  percentage: number;
  delay: number;
  action?: React.ReactNode;
}

const StatisticCard = ({ title, value, color, percentage, delay, action }: StatisticCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card p-4 relative"
    >
      <span className="text-sm text-muted-foreground">{title}</span>
      <div className={`text-2xl font-bold mt-1 text-${color}-600`}>{value}</div>
      <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
        <div 
          className={`h-1 bg-${color}-500 rounded-full`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {action && (
        <div className="absolute top-1 right-1">
          {action}
        </div>
      )}
    </motion.div>
  );
};

export default StatisticCard;
