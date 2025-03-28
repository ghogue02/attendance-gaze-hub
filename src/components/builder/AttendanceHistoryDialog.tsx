import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Plus, CalendarPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Builder, AttendanceRecord, BuilderStatus } from './types';
import { toast } from 'sonner';
import AttendanceHistoryTable from './AttendanceHistoryTable';
import AttendanceEditForm from './AttendanceEditForm';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isAddingNewDate, setIsAddingNewDate] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAttendanceHistory();
    } else {
      // Clear state when closing the dialog
      setEditingRecord(null);
      setIsAddingNewDate(false);
      setRecordToDelete(null);
      setDeleteDialogOpen(false);
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

      // Filter out dates before minimum date
      const filteredData = data.filter(record => {
        const date = new Date(record.date);
        // Only filter by minimum date, not day of week
        return date >= MINIMUM_DATE;
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
      
      // Calculate attendance rate (now only filtered for minimum date)
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
    console.log('Starting to edit record:', record);
    // Close the add new date form if it's open
    setIsAddingNewDate(false);
    
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

  const handleAddNewDate = () => {
    // Close editing form if it's open
    setEditingRecord(null);
    
    setIsAddingNewDate(true);
    setEditStatus('present');
    setEditExcuseReason('');
    setEditNotes('');
    // Default to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNewDate(tomorrow.toISOString().split('T')[0]);
  };

  const cancelAddNewDate = () => {
    setIsAddingNewDate(false);
    setNewDate('');
  };

  const validateNewDate = (dateString: string): boolean => {
    try {
      const date = new Date(dateString);
      
      // Check if it's a valid date
      if (isNaN(date.getTime())) {
        toast.error('Invalid date format');
        return false;
      }
      
      // No longer checking if it's a Friday
      
      // Check if it's after minimum date
      if (isBefore(date, MINIMUM_DATE)) {
        toast.error(`Date must be on or after ${format(MINIMUM_DATE, 'MMM d, yyyy')}`);
        return false;
      }
      
      // Check if it's not in the future
      if (isAfter(date, new Date())) {
        toast.error('Cannot add attendance for future dates');
        return false;
      }
      
      // Check if the date already exists in attendance history
      if (attendanceHistory.some(record => record.date === dateString)) {
        toast.error('Attendance record already exists for this date');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Date validation error:', error);
      toast.error('Invalid date');
      return false;
    }
  };

  const saveNewAttendanceRecord = async () => {
    if (!validateNewDate(newDate)) {
      return;
    }
    
    setIsLoading(true);
    try {
      // For database, we need to handle 'excused' status
      const dbStatus = editStatus === 'excused' ? 'absent' : editStatus;
      const dbExcuseReason = editStatus === 'excused' ? editExcuseReason : null;
      
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          student_id: builder.id,
          date: newDate,
          status: dbStatus,
          excuse_reason: dbExcuseReason,
          notes: editNotes,
          time_recorded: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error adding attendance record:', error);
        toast.error('Failed to add attendance record');
        return;
      }
      
      toast.success('Attendance record added');
      
      // Create new record for the UI
      const newRecord: AttendanceRecord = {
        id: data.id,
        date: newDate,
        status: editStatus,
        timeRecorded: new Date().toLocaleTimeString(),
        excuseReason: editStatus === 'excused' ? editExcuseReason : undefined,
        notes: editNotes || undefined
      };
      
      // Update local state - insert new record and sort by date
      setAttendanceHistory(prev => {
        const updated = [...prev, newRecord].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        calculateAttendanceRate(updated);
        return updated;
      });
      
      // Reset form
      cancelAddNewDate();
    } catch (error) {
      console.error('Error in saveNewAttendanceRecord:', error);
      toast.error('Error adding attendance record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = (record: AttendanceRecord) => {
    // Close other forms if they're open
    setEditingRecord(null);
    setIsAddingNewDate(false);
    
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', recordToDelete.id);

      if (error) {
        console.error('Error deleting attendance record:', error);
        toast.error('Failed to delete attendance record');
        return;
      }
      
      toast.success('Attendance record deleted');
      
      // Update local state
      const updatedHistory = attendanceHistory.filter(
        record => record.id !== recordToDelete.id
      );
      
      setAttendanceHistory(updatedHistory);
      // Recalculate attendance rate
      calculateAttendanceRate(updatedHistory);
      
      // Close the delete dialog
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Error in deleteAttendanceRecord:', error);
      toast.error('Error deleting attendance record');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Attendance History for {builder.name}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="px-1 space-y-4">
              {attendanceRate !== null && (
                <div className="mb-4 p-3 bg-muted/30 rounded-md">
                  <p className="font-medium text-center">
                    Overall Attendance Rate: 
                    <span className={`ml-2 ${attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {attendanceRate}%
                    </span>
                  </p>
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Based on {attendanceHistory.length} class sessions
                  </p>
                </div>
              )}
              
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
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as BuilderStatus)}
                        className="border p-2 rounded-md"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="excused">Excused Absence</option>
                      </select>
                    </div>
                    
                    {editStatus === 'excused' && (
                      <div className="grid grid-cols-1 gap-2">
                        <label className="text-sm font-medium">Excuse Reason:</label>
                        <textarea
                          value={editExcuseReason}
                          onChange={(e) => setEditExcuseReason(e.target.value)}
                          className="border p-2 rounded-md h-20 resize-none"
                          placeholder="Enter excuse reason..."
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-sm font-medium">Notes:</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="border p-2 rounded-md h-20 resize-none"
                        placeholder="Enter notes..."
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={cancelAddNewDate} disabled={isLoading}>
                        Cancel
                      </Button>
                      <Button onClick={saveNewAttendanceRecord} disabled={isLoading}>
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <AttendanceHistoryTable 
                attendanceHistory={attendanceHistory} 
                isLoading={isLoading}
                onEditRecord={startEditing}
                onDeleteRecord={handleDeleteRecord}
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
            </div>
          </ScrollArea>
          
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AttendanceHistoryDialog;
