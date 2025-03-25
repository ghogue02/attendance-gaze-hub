
import { Button } from '@/components/ui/button';
import { BuilderStatus } from './types';

interface BuilderStatusButtonsProps {
  currentStatus: BuilderStatus;
  onStatusChange: (status: BuilderStatus) => void;
}

const BuilderStatusButtons = ({ currentStatus, onStatusChange }: BuilderStatusButtonsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
      <Button
        variant="outline" 
        size="sm"
        className={`${currentStatus === 'present' ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
        onClick={() => onStatusChange('present')}
      >
        Present
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={`${currentStatus === 'excused' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}
        onClick={() => onStatusChange('excused')}
      >
        Excused
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={`${currentStatus === 'absent' ? 'bg-red-100 text-red-700 border-red-300' : ''}`}
        onClick={() => onStatusChange('absent')}
      >
        Absent
      </Button>
    </div>
  );
};

export default BuilderStatusButtons;
