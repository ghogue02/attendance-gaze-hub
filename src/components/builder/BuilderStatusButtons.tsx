
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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

// Create a RadioGroup version of the status buttons for forms
export const StatusRadioGroup = ({ 
  value, 
  onValueChange 
}: { 
  value: BuilderStatus; 
  onValueChange: (status: BuilderStatus) => void;
}) => {
  return (
    <RadioGroup 
      value={value} 
      onValueChange={onValueChange as (value: string) => void} 
      className="flex flex-row space-x-4"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="present" id="present" />
        <Label 
          htmlFor="present"
          className="text-green-700 font-medium"
        >
          Present
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="excused" id="excused" />
        <Label 
          htmlFor="excused"
          className="text-blue-700 font-medium"
        >
          Excused
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="absent" id="absent" />
        <Label 
          htmlFor="absent"
          className="text-red-700 font-medium"
        >
          Absent
        </Label>
      </div>
    </RadioGroup>
  );
};

export default BuilderStatusButtons;
