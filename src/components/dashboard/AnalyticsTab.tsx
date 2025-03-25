
import { Builder } from '@/components/builder/types';
import AttendanceChart from './AttendanceChart';
import AttendancePieChart from './AttendancePieChart';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface AnalyticsTabProps {
  builders: Builder[];
}

const AnalyticsTab = ({ builders }: AnalyticsTabProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Attendance Analytics</h2>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh Data</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart key={refreshKey} builders={builders} />
        <AttendancePieChart builders={builders} />
      </div>
    </div>
  );
};

export default AnalyticsTab;
