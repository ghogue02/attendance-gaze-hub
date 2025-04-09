
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2Icon } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string; 
  studentName: string;
  status: string;
  notes?: string;
}

interface AttendanceTableProps {
  attendanceRecords: AttendanceRecord[];
  formatDate: (date: string) => string;
  onDeleteRecord: (record: AttendanceRecord) => void;
  onNavigateToBuilder: (record: AttendanceRecord) => void;
}

const AttendanceTable = ({ 
  attendanceRecords, 
  formatDate,
  onDeleteRecord,
  onNavigateToBuilder,
}: AttendanceTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Builder</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendanceRecords.map((record) => (
            <TableRow 
              key={record.id}
              onClick={() => onNavigateToBuilder(record)}
              className="cursor-pointer hover:bg-muted/60"
            >
              <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
              <TableCell>{record.studentName}</TableCell>
              <TableCell>
                <span className={`font-medium ${getStatusClass(record.status)}`}>
                  {formatStatus(record.status)}
                </span>
              </TableCell>
              <TableCell>{record.notes || '—'}</TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click
                    onDeleteRecord(record);
                  }}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Helper function to get appropriate CSS class for status
function getStatusClass(status: string): string {
  switch(status.toLowerCase()) {
    case 'present':
      return 'text-green-600';
    case 'absent':
      return 'text-red-600';
    case 'excused':
      return 'text-yellow-600';  
    case 'late':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
}

// Helper function to format status for display
function formatStatus(status: string): string {
  if (status.toLowerCase() === 'excused') {
    return 'Excused Absence';
  }
  
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default AttendanceTable;
