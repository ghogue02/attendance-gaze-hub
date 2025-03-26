
import React from 'react';
import { BuilderStatus, AttendanceRecord } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { formatDate } from './BuilderCardUtils';

interface AttendanceEditFormProps {
  record: AttendanceRecord;
  editStatus: BuilderStatus;
  editExcuseReason: string;
  editNotes: string;
  isLoading: boolean;
  onStatusChange: (value: BuilderStatus) => void;
  onExcuseReasonChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const AttendanceEditForm = ({
  record,
  editStatus,
  editExcuseReason,
  editNotes,
  isLoading,
  onStatusChange,
  onExcuseReasonChange,
  onNotesChange,
  onSave,
  onCancel
}: AttendanceEditFormProps) => {
  return (
    <div className="mt-4 space-y-4 border rounded-md p-4 bg-muted/20">
      <h3 className="text-sm font-medium">Edit Attendance Record for {formatDate(record.date)}</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Status:</label>
        <Select value={editStatus} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="excused">Excused</SelectItem>
            <SelectItem value="late">Late</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {editStatus === 'excused' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Excuse Reason:</label>
          <Textarea 
            value={editExcuseReason} 
            onChange={(e) => onExcuseReasonChange(e.target.value)}
            placeholder="Enter reason for excused absence"
            className="min-h-[80px]"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Attendance Notes:</label>
        <Textarea 
          value={editNotes} 
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Enter any notes about this attendance record"
          className="min-h-[80px]"
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={isLoading}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default AttendanceEditForm;
