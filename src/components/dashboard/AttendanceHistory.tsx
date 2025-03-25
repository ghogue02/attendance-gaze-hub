
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Builder, BuilderStatus } from '@/components/builder/types';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AttendanceHistoryProps {
  builders: Builder[];
  onError?: (message: string) => void;
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

const AttendanceHistory = ({ builders, onError }: AttendanceHistoryProps) => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      setIsLoading(true);
      
      try {
        // Create a map of student IDs to names for easier lookup
        const builderMap = new Map();
        
        // Populate the map with all builders
        builders.forEach(builder => {
          builderMap.set(builder.id, {
            name: builder.name,
            builderId: builder.builderId
          });
        });
        
        // Fetch ALL attendance data without any filtering or date constraints
        // Order by date DESC to get the most recent records first
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching attendance history:', error);
          toast.error('Failed to load attendance history');
          if (onError) onError('Failed to load attendance history: ' + error.message);
          return;
        }
        
        console.log('Raw attendance history data:', data?.length || 0, 'records', data);
        
        if (!data || data.length === 0) {
          console.log('No attendance data found');
          setAttendanceHistory([]);
          setIsLoading(false);
          return;
        }
        
        // Map database records to our format with detailed logging
        const history: AttendanceRecord[] = data.map(record => {
          const builder = builderMap.get(record.student_id);
          
          // Debug the record
          console.log('Processing record:', { 
            id: record.id,
            student_id: record.student_id,
            status: record.status,
            date: record.date,
            builder: builder ? `${builder.name} (${builder.builderId})` : 'Unknown student'
          });
          
          // Determine the status - if there's an excuse_reason, it should be "excused"
          let status: BuilderStatus = record.status as BuilderStatus;
          if (record.excuse_reason && record.status === 'absent') {
            status = 'excused';
          }
          
          return {
            id: record.id,
            name: builder?.name || `Unknown (ID: ${record.student_id.substring(0, 8)}...)`,
            builderId: builder?.builderId || '',
            status,
            date: record.date,
            timeRecorded: record.time_recorded 
              ? new Date(record.time_recorded).toLocaleTimeString() 
              : undefined,
            excuseReason: record.excuse_reason
          };
        });
        
        console.log('Processed attendance history:', history.length, history);
        setAttendanceHistory(history);
      } catch (error) {
        console.error('Error in fetchAttendanceHistory:', error);
        toast.error('Error loading attendance history');
        if (onError) onError('Error loading attendance history: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAttendanceHistory();
  }, [builders, onError]);
  
  // Format date string from YYYY-MM-DD format to MMM D, YYYY display format
  const formatDate = (dateStr: string) => {
    try {
      // Ensure we have a valid date string
      if (!dateStr) return '';
      
      // Parse date components to avoid timezone issues
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JS months are 0-based
      const day = parseInt(parts[2]);
      
      // Create date with correct parts and no timezone adjustments
      const date = new Date(year, month, day);
      
      // Format the date as "MMM d, yyyy" (e.g., "Mar 22, 2025")
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e, dateStr);
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
                      {record.status === 'excused' ? 'Excused Absence' : record.status}
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
