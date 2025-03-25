
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, PencilIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Builder, AttendanceRecord, BuilderStatus } from './types';
import { getStatusColor, formatDate } from './BuilderCardUtils';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface HistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  builder: Builder;
}

const HistoryDialog = ({ isOpen, onClose, builder }: HistoryDialogProps) => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

      const history: AttendanceRecord[] = data.map(record => {
        let status: BuilderStatus = record.status as BuilderStatus;
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
    } catch (error) {
      console.error('Error in fetchAttendanceHistory:', error);
      toast.error('Error loading attendance history');
    } finally {
      setIsLoading(false);
    }
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
        
        {isLoading && !editingRecord ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : attendanceHistory.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">No attendance records found for this builder.</p>
        ) : (
          <div className="overflow-y-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-12"></TableHead> {/* Column for edit button */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>
                      <span className={`font-medium capitalize ${getStatusColor(record.status).split(' ')[1]}`}>
                        {record.status === 'excused' ? 'Excused Absence' : record.status}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[250px] break-words">
                      {record.excuseReason ? (
                        <div>
                          <p className="font-medium text-xs">Excuse:</p>
                          <p className="text-sm">{record.excuseReason}</p>
                        </div>
                      ) : null}
                      {record.notes ? (
                        <div className="mt-1">
                          <p className="font-medium text-xs">Notes:</p>
                          <p className="text-sm">{record.notes}</p>
                        </div>
                      ) : record.excuseReason ? null : '—'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => startEditing(record)}
                        title="Edit record"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {editingRecord && (
          <div className="mt-4 space-y-4 border rounded-md p-4 bg-muted/20">
            <h3 className="text-sm font-medium">Edit Attendance Record for {formatDate(editingRecord.date)}</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status:</label>
              <Select value={editStatus} onValueChange={setEditStatus as any}>
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
                  onChange={(e) => setEditExcuseReason(e.target.value)}
                  placeholder="Enter reason for excused absence"
                  className="min-h-[80px]"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Attendance Notes:</label>
              <Textarea 
                value={editNotes} 
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Enter any notes about this attendance record"
                className="min-h-[80px]"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={cancelEditing} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={saveAttendanceChanges} disabled={isLoading}>
                Save Changes
              </Button>
            </div>
          </div>
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

export default HistoryDialog;
