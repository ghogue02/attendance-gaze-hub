
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { getStatusColor } from '@/components/builder/BuilderCardUtils';

interface AttendanceHistoryProps {
  builders: Builder[];
  onError: (message: string) => void;
}

interface AttendanceRecord {
  id: string;
  date: string;
  studentName: string;
  studentId: string;
  status: BuilderStatus;
  timeRecorded: string | null;
  notes: string | null;
  excuseReason: string | null;
}

const AttendanceHistory = ({ builders, onError }: AttendanceHistoryProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
  // Use useCallback to prevent the function from being recreated on each render
  const fetchAttendanceHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id, 
          date, 
          status, 
          time_recorded, 
          notes, 
          excuse_reason,
          students(id, first_name, last_name, student_id)
        `)
        .neq('status', 'pending')
        .order('date', { ascending: false })
        .order('time_recorded', { ascending: false });
        
      if (error) {
        console.error('Error fetching attendance history:', error);
        onError('Failed to load attendance history');
        setIsLoading(false);
        return;
      }
      
      const formattedRecords: AttendanceRecord[] = data.map(record => {
        const student = record.students;
        const fullName = `${student.first_name} ${student.last_name || ''}`.trim();
        
        let statusDisplay: BuilderStatus = 'absent';
        
        if (record.status === 'present') {
          statusDisplay = 'present';
        } else if (record.status === 'late') {
          statusDisplay = 'late';
        } else if (record.status === 'pending') {
          statusDisplay = 'pending';
        } else if (record.status === 'absent') {
          statusDisplay = record.excuse_reason ? 'excused' : 'absent';
        }
        
        return {
          id: record.id,
          date: record.date,
          studentName: fullName,
          studentId: student.student_id || '',
          status: statusDisplay,
          timeRecorded: record.time_recorded ? new Date(record.time_recorded).toLocaleTimeString() : null,
          notes: record.notes,
          excuseReason: record.excuse_reason
        };
      });
      
      setAttendanceRecords(formattedRecords);
    } catch (error) {
      console.error('Error in fetchAttendanceHistory:', error);
      onError('An error occurred while loading attendance history');
    } finally {
      setIsLoading(false);
    }
  }, [onError]);
  
  useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory]);
  
  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      
      const date = new Date(year, month, day);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateStr;
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  if (attendanceRecords.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No attendance records found.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Builder ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendanceRecords.map(record => (
            <TableRow key={record.id}>
              <TableCell>{formatDate(record.date)}</TableCell>
              <TableCell>{record.studentName}</TableCell>
              <TableCell>{record.studentId}</TableCell>
              <TableCell>
                <span className={`font-medium capitalize ${getStatusColor(record.status).split(' ')[1]}`}>
                  {record.status === 'excused' ? 'Excused Absence' : record.status}
                </span>
              </TableCell>
              <TableCell>{record.timeRecorded || '—'}</TableCell>
              <TableCell className="max-w-[250px] break-words">
                {record.excuseReason ? (
                  <div>
                    <p className="font-medium text-xs">Excuse:</p>
                    <p className="text-sm">{record.excuseReason}</p>
                  </div>
                ) : null}
                {record.notes ? (
                  <div className={record.excuseReason ? "mt-1" : ""}>
                    <p className="font-medium text-xs">Notes:</p>
                    <p className="text-sm">{record.notes}</p>
                  </div>
                ) : record.excuseReason ? null : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AttendanceHistory;
