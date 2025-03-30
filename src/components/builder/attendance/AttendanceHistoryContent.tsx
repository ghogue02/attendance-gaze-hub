
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import { Builder, AttendanceRecord, BuilderStatus } from '../types';
import AttendanceHistoryTable from '../AttendanceHistoryTable';
import AttendanceEditForm from '../AttendanceEditForm';
import AttendanceStats from './AttendanceStats';
import AddNewDateForm from './AddNewDateForm';

interface AttendanceHistoryContentProps {
  builder: Builder;
  attendanceHistory: AttendanceRecord[];
  isLoading: boolean;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (record: AttendanceRecord) => void;
  onAddNewDate: (date: string, status: BuilderStatus, excuseReason: string, notes: string) => Promise<void>;
  editingRecord: AttendanceRecord | null;
  editStatus: BuilderStatus;
  editExcuseReason: string;
  editNotes: string;
  onStatusChange: (status: BuilderStatus) => void;
  onExcuseReasonChange: (reason: string) => void;
  onNotesChange: (notes: string) => void;
  onSaveChanges: () => Promise<void>;
  onCancelEdit: () => void;
}

const AttendanceHistoryContent = ({
  builder,
  attendanceHistory,
  isLoading,
  onEditRecord,
  onDeleteRecord,
  onAddNewDate,
  editingRecord,
  editStatus,
  editExcuseReason,
  editNotes,
  onStatusChange,
  onExcuseReasonChange,
  onNotesChange,
  onSaveChanges,
  onCancelEdit
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
            disabled={isAddingNewDate || !!editingRecord}
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
      </div>
    </ScrollArea>
  );
};

export default AttendanceHistoryContent;
