
import { Builder } from '@/components/builder/types';
import AttendanceChart from './AttendanceChart';
import AttendancePieChart from './AttendancePieChart';

interface AnalyticsTabProps {
  builders: Builder[];
}

const AnalyticsTab = ({ builders }: AnalyticsTabProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Attendance Analytics</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart builders={builders} />
        <AttendancePieChart builders={builders} />
      </div>
    </div>
  );
};

export default AnalyticsTab;
