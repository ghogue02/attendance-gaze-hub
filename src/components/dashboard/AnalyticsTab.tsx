
import { Builder } from '@/components/builder/types';
import AttendanceChart from './AttendanceChart';
import AttendancePieChart from './AttendancePieChart';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AnalyticsTabProps {
  builders: Builder[];
}

const AnalyticsTab = ({ builders }: AnalyticsTabProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Analytics data refreshed');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Attendance Analytics</h2>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh Data</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart key={`attendance-chart-${refreshKey}`} builders={builders} days={7} />
        <AttendancePieChart key={`attendance-pie-${refreshKey}`} builders={builders} />
      </div>
    </div>
  );
};

export default AnalyticsTab;
