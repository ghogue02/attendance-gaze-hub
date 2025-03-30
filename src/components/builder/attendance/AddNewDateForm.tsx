
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BuilderStatus } from '../types';
import { validateAttendanceDate } from './attendanceValidation';
import { toast } from 'sonner';

interface AddNewDateFormProps {
  onCancel: () => void;
  onSave: (date: string, status: BuilderStatus, excuseReason: string, notes: string) => Promise<void>;
  isLoading: boolean;
  existingDates: string[];
}

const AddNewDateForm = ({ onCancel, onSave, isLoading, existingDates }: AddNewDateFormProps) => {
  const [newDate, setNewDate] = useState(() => {
    // Default to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<BuilderStatus>('present');
  const [excuseReason, setExcuseReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!validateAttendanceDate(newDate, existingDates)) {
      return;
    }
    
    await onSave(newDate, status, excuseReason, notes);
  };

  return (
    <div className="border rounded-md p-4 mb-4 bg-muted/20">
      <h3 className="font-medium mb-3">Add New Attendance Record</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <label htmlFor="new-date" className="text-sm font-medium">
            Date:
          </label>
          <input
            id="new-date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="border p-2 rounded-md"
            min="2025-03-15"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <label className="text-sm font-medium">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BuilderStatus)}
            className="border p-2 rounded-md"
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused Absence</option>
          </select>
        </div>
        
        {status === 'excused' && (
          <div className="grid grid-cols-1 gap-2">
            <label className="text-sm font-medium">Excuse Reason:</label>
            <textarea
              value={excuseReason}
              onChange={(e) => setExcuseReason(e.target.value)}
              className="border p-2 rounded-md h-20 resize-none"
              placeholder="Enter excuse reason..."
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-2">
          <label className="text-sm font-medium">Notes:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border p-2 rounded-md h-20 resize-none"
            placeholder="Enter notes..."
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddNewDateForm;
