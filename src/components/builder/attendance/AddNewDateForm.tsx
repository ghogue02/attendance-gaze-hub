import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BuilderStatus } from '@/components/builder/types';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { StatusRadioGroup } from '@/components/builder/BuilderStatusButtons';

interface AddNewDateFormProps {
  onCancel: () => void;
  onSave: (date: string, status: BuilderStatus, excuseReason: string, notes: string) => Promise<void>;
  isLoading: boolean;
  existingDates: string[];
}

const isFriday = (date: Date): boolean => {
  return date.getDay() === 5;
};

const isApril4th2025 = (date: Date): boolean => {
  return date.getFullYear() === 2025 && date.getMonth() === 3 && date.getDate() === 4;
};

const AddNewDateForm = ({ onCancel, onSave, isLoading, existingDates }: AddNewDateFormProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<BuilderStatus>('present');
  const [excuseReason, setExcuseReason] = useState('');
  const [notes, setNotes] = useState('');
  const [dateError, setDateError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      setDateError('Please select a date');
      return;
    }
    
    if (isFriday(date)) {
      setDateError('Fridays are not valid class days');
      return;
    }
    
    if (isApril4th2025(date)) {
      setDateError('April 4th, 2025 is not a valid class day');
      return;
    }

    const formattedDate = format(date, 'yyyy-MM-dd');
    
    if (existingDates.includes(formattedDate)) {
      setDateError('An attendance record already exists for this date');
      return;
    }
    
    await onSave(formattedDate, status, excuseReason, notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-md bg-muted/20">
      <h3 className="text-lg font-medium">Add New Attendance Record</h3>
      
      <div className="space-y-2">
        <Label>Date</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-start text-left ${dateError ? 'border-destructive' : ''}`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'MMMM d, yyyy') : <span>Select date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                setDateError('');
                setOpen(false);
              }}
              disabled={(date) => {
                return isFriday(date) || isApril4th2025(date);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {dateError && <p className="text-destructive text-xs mt-1">{dateError}</p>}
      </div>
      
      <div className="space-y-2">
        <Label>Status</Label>
        <StatusRadioGroup 
          value={status} 
          onValueChange={(value: BuilderStatus) => setStatus(value)} 
        />
      </div>
      
      {status === 'excused' && (
        <div className="space-y-2">
          <Label htmlFor="excuseReason">Excuse Reason</Label>
          <Textarea
            id="excuseReason"
            value={excuseReason}
            onChange={(e) => setExcuseReason(e.target.value)}
            placeholder="Enter reason for excused absence..."
            className="resize-none"
            required={status === 'excused'}
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
          className="resize-none"
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !date}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddNewDateForm;
