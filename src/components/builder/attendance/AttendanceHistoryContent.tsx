
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import { Builder, AttendanceRecord, BuilderStatus } from '../types';
import AttendanceHistoryTable from '../AttendanceHistoryTable';
import AttendanceEditForm from '../AttendanceEditForm';
import AttendanceStats from './AttendanceStats';
import AddNewDateForm from './AddNewDateForm';
import EditAttendanceDateForm from './EditAttendanceDateForm';

interface AttendanceHistoryContentProps {
  builder: Builder;
  attendanceHistory: AttendanceRecord[];
  isLoading: boolean;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (record: AttendanceRecord) => void;
  onEditDate: (record: AttendanceRecord) => void;
  onAddNewDate: (date: string, status: BuilderStatus, excuseReason: string, notes: string) => Promise<void>;
  onSaveNewDate: (recordId: string, newDate: string) => Promise<void>;
  editingRecord: AttendanceRecord | null;
  editStatus: BuilderStatus;
  editExcuseReason: string;
  editNotes: string;
  editingDate: AttendanceRecord | null;
  onStatusChange: (status: BuilderStatus) => void;
  onExcuseReasonChange: (reason: string) => void;
  onNotesChange: (notes: string) => void;
  onSaveChanges: () => Promise<void>;
  onCancelEdit: () => void;
  onCancelEditDate: () => void;
}

const AttendanceHistoryContent = ({
  builder,
  attendanceHistory,
  isLoading,
  onEditRecord,
  onDeleteRecord,
  onEditDate,
  onAddNewDate,
  onSaveNewDate,
  editingRecord,
  editStatus,
  editExcuseReason,
  editNotes,
  editingDate,
  onStatusChange,
  onExcuseReasonChange,
  onNotesChange,
  onSaveChanges,
  onCancelEdit,
  onCancelEditDate
}: AttendanceHistoryContentProps) => {
  const [isAddingNewDate, setIsAddingNewDate] = useState(false);

  const handleAddNewDate = () => {
    setIsAddingNewDate(true);
  };

  const handleCancelAddNewDate = () => {
    setIsAddingNewDate(false);
  };

  const handleSaveNewDate = async (
    date: string, 
    status: BuilderStatus, 
    excuseReason: string, 
    notes: string
  ) => {
    await onAddNewDate(date, status, excuseReason, notes);
    setIsAddingNewDate(false);
  };

  const existingDates = attendanceHistory.map(record => record.date);

  return (
    <ScrollArea className="flex-1 overflow-y-auto">
      <div className="px-1 space-y-4">
        <AttendanceStats attendanceHistory={attendanceHistory} />
        
        <div className="flex justify-end mb-4">
          <Button 
            onClick={handleAddNewDate} 
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
            disabled={isAddingNewDate || !!editingRecord || !!editingDate}
          >
            <CalendarPlus className="h-4 w-4" />
            Add Missing Date
          </Button>
        </div>
        
        {isAddingNewDate && (
          <AddNewDateForm
            onCancel={handleCancelAddNewDate}
            onSave={handleSaveNewDate}
            isLoading={isLoading}
            existingDates={existingDates}
          />
        )}
        
        <AttendanceHistoryTable 
          attendanceHistory={attendanceHistory} 
          isLoading={isLoading}
          onEditRecord={onEditRecord}
          onEditDate={onEditDate}
          onDeleteRecord={onDeleteRecord}
        />
        
        {editingRecord && (
          <AttendanceEditForm
            record={editingRecord}
            editStatus={editStatus}
            editExcuseReason={editExcuseReason}
            editNotes={editNotes}
            isLoading={isLoading}
            onStatusChange={onStatusChange}
            onExcuseReasonChange={onExcuseReasonChange}
            onNotesChange={onNotesChange}
            onSave={onSaveChanges}
            onCancel={onCancelEdit}
          />
        )}
        
        {editingDate && (
          <EditAttendanceDateForm
            currentDate={editingDate.date}
            existingDates={existingDates}
            isLoading={isLoading}
            onSave={async (newDate) => await onSaveNewDate(editingDate.id, newDate)}
            onCancel={onCancelEditDate}
          />
        )}
      </div>
    </ScrollArea>
  );
};

export default AttendanceHistoryContent;
