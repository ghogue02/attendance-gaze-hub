
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Builder, BuilderStatus } from '@/components/BuilderCard';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AttendanceHistoryProps {
  builders: Builder[];
}

interface AttendanceRecord {
  id: string;
  name: string;
  builderId: string;
  status: BuilderStatus;
  date: string;
  timeRecorded?: string;
  excuseReason?: string;
}

// Helper function to get status color
const getStatusColor = (status: BuilderStatus) => {
  switch (status) {
    case 'present':
      return 'text-green-600';
    case 'absent':
      return 'text-red-600';
    case 'excused':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
};

const AttendanceHistory = ({ builders }: AttendanceHistoryProps) => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      setIsLoading(true);
      
      try {
        // Get the past 7 days
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6); // Get last 7 days including today
        
        const startDateStr = startDate.toISOString().split('T')[0];
        
        console.log(`Fetching attendance from ${startDateStr} to ${today.toISOString().split('T')[0]}`);
        
        // Build a map of student IDs to names
        const builderMap = new Map(
          builders.map(builder => [builder.id, {
            name: builder.name,
            builderId: builder.builderId
          }])
        );
        
        // Fetch attendance data without filtering by student_id
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .gte('date', startDateStr)
          .order('date', { ascending: false });
          
        if (error) {
          console.error('Error fetching attendance history:', error);
          toast.error('Failed to load attendance history');
          return;
        }
        
        console.log('Attendance history data:', data?.length || 0, 'records');
        
        if (!data || data.length === 0) {
          setAttendanceHistory([]);
          setIsLoading(false);
          return;
        }
        
        // Map database records to our format
        const history: AttendanceRecord[] = data.map(record => {
          const builder = builderMap.get(record.student_id);
          return {
            id: record.id,
            name: builder?.name || 'Unknown',
            builderId: builder?.builderId || '',
            status: record.status as BuilderStatus,
            date: typeof record.date === 'string' 
              ? record.date 
              : new Date(record.date).toISOString().split('T')[0],
            timeRecorded: record.time_recorded 
              ? new Date(record.time_recorded).toLocaleTimeString() 
              : undefined,
            excuseReason: record.excuse_reason
          };
        });
        
        console.log('Processed attendance history:', history.length);
        setAttendanceHistory(history);
      } catch (error) {
        console.error('Error in fetchAttendanceHistory:', error);
        toast.error('Error loading attendance history');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAttendanceHistory();
  }, [builders]);
  
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };
  
  return (
    <div className="glass-card p-6 overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">Attendance History</h3>
      {isLoading ? (
        <div className="flex justify-center my-8">
          <p className="text-muted-foreground">Loading attendance history...</p>
        </div>
      ) : attendanceHistory.length === 0 ? (
        <div className="flex justify-center my-8">
          <p className="text-muted-foreground">No attendance records found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
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
              {attendanceHistory.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{record.builderId}</TableCell>
                  <TableCell>
                    <span className={`font-medium capitalize ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </TableCell>
                  <TableCell>{record.timeRecorded || '—'}</TableCell>
                  <TableCell>{record.excuseReason || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
