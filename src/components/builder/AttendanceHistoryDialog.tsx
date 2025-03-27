
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Builder, AttendanceRecord, BuilderStatus } from './types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';
import { formatDate, getStatusColor } from './BuilderCardUtils';

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
        
        {isLoading ? (
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
                      {record.excuseReason || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

export default AttendanceHistoryDialog;
