
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface AttendanceHistoryHeaderProps {
  onClearAutomatedNotes: () => void;
  isClearing: boolean;
}

const AttendanceHistoryHeader = ({
  onClearAutomatedNotes,
  isClearing
}: AttendanceHistoryHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold">Attendance History</h2>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onClearAutomatedNotes} 
        disabled={isClearing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isClearing ? 'animate-spin' : ''}`} />
        Clear Automated Notes
      </Button>
    </div>
  );
};

export default AttendanceHistoryHeader;
