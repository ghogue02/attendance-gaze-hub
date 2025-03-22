
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, RefreshCw, Download } from 'lucide-react';

interface DashboardHeaderProps {
  selectedDate: string;
  onRefresh: () => void;
}

const DashboardHeader = ({ selectedDate, onRefresh }: DashboardHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <span className="section-subtitle inline-block mb-1">Attendance Records</span>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          <span className="text-sm">{selectedDate}</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </div>
        
        <button 
          onClick={onRefresh} 
          className="btn-secondary flex items-center gap-2 py-2 px-3"
        >
          <RefreshCw size={16} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        
        <button className="btn-primary flex items-center gap-2 py-2 px-3">
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;
