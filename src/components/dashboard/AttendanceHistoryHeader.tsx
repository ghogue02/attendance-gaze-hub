
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

interface AttendanceHistoryHeaderProps {
  onClearAutomatedNotes: () => void;
  isClearing: boolean;
}

const AttendanceHistoryHeader = ({ 
  onClearAutomatedNotes,
  isClearing 
}: AttendanceHistoryHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-semibold">Attendance History</h2>
      <Button 
        variant="outline" 
        onClick={onClearAutomatedNotes}
        disabled={isClearing}
        className="flex items-center gap-2"
      >
        <RefreshCcw className={`h-4 w-4 ${isClearing ? 'animate-spin' : ''}`} />
        Clear Automated Notes
      </Button>
    </div>
  );
};

export default AttendanceHistoryHeader;
