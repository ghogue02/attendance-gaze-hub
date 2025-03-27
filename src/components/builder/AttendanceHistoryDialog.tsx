
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Builder, AttendanceRecord, BuilderStatus } from './types';
import { toast } from 'sonner';
import AttendanceHistoryTable from './AttendanceHistoryTable';
import AttendanceEditForm from './AttendanceEditForm';

interface AttendanceHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  builder: Builder;
}

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');

const AttendanceHistoryDialog = ({ isOpen, onClose, builder }: AttendanceHistoryDialogProps) => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<BuilderStatus>('present');
  const [editExcuseReason, setEditExcuseReason] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAttendanceHistory();
    }
  }, [isOpen, builder.id]);

  const fetchAttendanceHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', builder.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching builder attendance history:', error);
        toast.error('Failed to load attendance history');
        return;
      }

      // Filter out Fridays and dates before minimum date
      const filteredData = data.filter(record => {
        const date = new Date(record.date);
        return date.getDay() !== 5 && date >= MINIMUM_DATE;
      });

      const history: AttendanceRecord[] = filteredData.map(record => {
        // Convert string status to BuilderStatus type
        let status: BuilderStatus = record.status as BuilderStatus;
        
        // Handle excused absences
        if (record.excuse_reason && record.status === 'absent') {
          status = 'excused';
        }

        return {
          id: record.id,
          date: record.date,
          status,
          timeRecorded: record.time_recorded 
            ? new Date(record.time_recorded).toLocaleTimeString() 
            : undefined,
          excuseReason: record.excuse_reason,
          notes: record.notes
        };
      });

      setAttendanceHistory(history);
      
      // Calculate attendance rate (already filtered for Fridays and minimum date)
      calculateAttendanceRate(history);
    } catch (error) {
      console.error('Error in fetchAttendanceHistory:', error);
      toast.error('Error loading attendance history');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAttendanceRate = (records: AttendanceRecord[]) => {
    if (records.length === 0) {
      setAttendanceRate(null);
      return;
    }

    // Count the number of days the builder was present or late
    const presentCount = records.filter(
      record => record.status === 'present' || record.status === 'late'
    ).length;

    // Calculate the rate
    const rate = (presentCount / records.length) * 100;
    setAttendanceRate(Math.round(rate));
  };

  const startEditing = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditStatus(record.status);
    setEditExcuseReason(record.excuseReason || '');
    setEditNotes(record.notes || '');
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setEditStatus('present');
    setEditExcuseReason('');
    setEditNotes('');
  };

  const saveAttendanceChanges = async () => {
    if (!editingRecord) return;
    
    setIsLoading(true);
    try {
      // For database, we need to handle 'excused' status by setting status to 'absent' with excuse_reason
      const dbStatus = editStatus === 'excused' ? 'absent' : editStatus;
      const dbExcuseReason = editStatus === 'excused' ? editExcuseReason : null;
      
      const { error } = await supabase
        .from('attendance')
        .update({
          status: dbStatus,
          excuse_reason: dbExcuseReason,
          notes: editNotes,
          time_recorded: new Date().toISOString()
        })
        .eq('id', editingRecord.id);

      if (error) {
        console.error('Error updating attendance record:', error);
        toast.error('Failed to update attendance');
        return;
      }
      
      toast.success('Attendance record updated');
      
      // Update local state
      setAttendanceHistory(prev => 
        prev.map(record => 
          record.id === editingRecord.id
            ? {
                ...record,
                status: editStatus,
                excuseReason: editStatus === 'excused' ? editExcuseReason : undefined,
                notes: editNotes,
                timeRecorded: new Date().toLocaleTimeString()
              }
            : record
        )
      );
      
      cancelEditing();
    } catch (error) {
      console.error('Error in saveAttendanceChanges:', error);
      toast.error('Error updating attendance');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Attendance History for {builder.name}
          </DialogTitle>
        </DialogHeader>
        
        {attendanceRate !== null && (
          <div className="mb-4 p-3 bg-muted/30 rounded-md">
            <p className="font-medium text-center">
              Overall Attendance Rate: 
              <span className={`ml-2 ${attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {attendanceRate}%
              </span>
            </p>
            <p className="text-xs text-center text-muted-foreground mt-1">
              Based on {attendanceHistory.length} class sessions (excluding Fridays)
            </p>
          </div>
        )}
        
        <AttendanceHistoryTable 
          attendanceHistory={attendanceHistory} 
          isLoading={isLoading}
          onEditRecord={startEditing}
        />
        
        {editingRecord && (
          <AttendanceEditForm
            record={editingRecord}
            editStatus={editStatus}
            editExcuseReason={editExcuseReason}
            editNotes={editNotes}
            isLoading={isLoading}
            onStatusChange={setEditStatus}
            onExcuseReasonChange={setEditExcuseReason}
            onNotesChange={setEditNotes}
            onSave={saveAttendanceChanges}
            onCancel={cancelEditing}
          />
        )}
        
        <DialogFooter className="mt-4">
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceHistoryDialog;
