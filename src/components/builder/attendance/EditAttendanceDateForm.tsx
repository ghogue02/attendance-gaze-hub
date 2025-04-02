
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { MINIMUM_DATE } from './attendanceValidation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EditAttendanceDateFormProps {
  currentDate: string;
  existingDates: string[];
  onSave: (newDate: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const EditAttendanceDateForm = ({
  currentDate,
  existingDates,
  onSave,
  onCancel,
  isLoading
}: EditAttendanceDateFormProps) => {
  const [date, setDate] = useState<Date | undefined>(
    currentDate ? new Date(currentDate) : undefined
  );
  const [open, setOpen] = useState(false);

  // Check if the selected date is valid to save
  const isDateValid = () => {
    if (!date) return false;

    // Format date to YYYY-MM-DD for comparison
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Don't allow saving if the date is the same as current
    if (formattedDate === currentDate) return false;
    
    // Check if this date already exists for this student
    const dateExists = existingDates.some(d => d === formattedDate && d !== currentDate);
    
    return !dateExists;
  };

  const handleSave = async () => {
    if (!date || !isDateValid()) return;
    
    await onSave(format(date, 'yyyy-MM-dd'));
  };

  // Apply date restrictions
  const fromDate = MINIMUM_DATE;
  const toDate = new Date(); // Today

  const handleSelectDate = (newDate: Date | undefined) => {
    setDate(newDate);
    
    // Using setTimeout to allow the state to update before closing
    // This helps ensure the date is properly set before the popover closes
    if (newDate) {
      setTimeout(() => setOpen(false), 100);
    }
  };

  return (
    <div className="mt-4 space-y-4 border rounded-md p-4 bg-muted/20">
      <h3 className="text-sm font-medium">Edit Attendance Date</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Current date: {format(new Date(currentDate), 'MMMM d, yyyy')}</label>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'MMMM d, yyyy') : "Select new date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelectDate}
              disabled={(date) => 
                date < fromDate || 
                date > toDate
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        {date && existingDates.some(d => d === format(date, 'yyyy-MM-dd') && d !== currentDate) && (
          <p className="text-sm text-destructive">This date already has an attendance record.</p>
        )}
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading || !date || !isDateValid()}
                >
                  Save Changes
                </Button>
              </span>
            </TooltipTrigger>
            {!isDateValid() && date && date !== new Date(currentDate) && (
              <TooltipContent>
                <p>This date already has an attendance record</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default EditAttendanceDateForm;
