
import { Builder } from '@/components/builder/types';
import AttendanceHistory from './AttendanceHistory';

interface HistoryTabProps {
  builders: Builder[];
}

const HistoryTab = ({ builders }: HistoryTabProps) => {
  return (
    <div className="space-y-6">
      <AttendanceHistory builders={builders} />
    </div>
  );
};

export default HistoryTab;
