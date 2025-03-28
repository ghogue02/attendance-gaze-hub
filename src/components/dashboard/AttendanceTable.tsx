
import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2Icon } from 'lucide-react';
import { AttendanceRecord } from './AttendanceTypes';
import { getStatusColor } from '@/components/builder/BuilderCardUtils';

interface AttendanceTableProps {
  attendanceRecords: AttendanceRecord[];
  formatDate: (dateStr: string) => string;
  onDeleteRecord: (record: AttendanceRecord, e: React.MouseEvent) => void;
}

const AttendanceTable = memo(({
  attendanceRecords,
  formatDate,
  onDeleteRecord
}: AttendanceTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Builder ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
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
            <TableCell className="text-right">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => onDeleteRecord(record, e)}
                title="Delete record"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});

AttendanceTable.displayName = 'AttendanceTable';

export default AttendanceTable;
