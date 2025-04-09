
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Trash2Icon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttendanceRecord } from './AttendanceTypes';

interface AttendanceTableProps {
  attendanceRecords: AttendanceRecord[];
  formatDate: (dateString: string) => string;
  onDeleteRecord: (record: AttendanceRecord) => void;
  onNavigateToBuilder?: (record: AttendanceRecord) => void;
}

const AttendanceTable = ({
  attendanceRecords,
  formatDate,
  onDeleteRecord,
  onNavigateToBuilder
}: AttendanceTableProps) => {
  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Builder ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendanceRecords.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{formatDate(record.date)}</TableCell>
              <TableCell>
                {onNavigateToBuilder ? (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal text-primary hover:text-primary/80 flex items-center gap-1"
                    onClick={() => onNavigateToBuilder(record)}
                  >
                    <User className="h-3.5 w-3.5" />
                    {record.studentName}
                  </Button>
                ) : (
                  record.studentName
                )}
              </TableCell>
              <TableCell>{record.studentId}</TableCell>
              <TableCell>
                <span 
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    record.status === 'present' ? 'bg-green-100 text-green-800' : 
                    record.status === 'absent' ? 'bg-red-100 text-red-800' : 
                    record.status === 'excused' ? 'bg-amber-100 text-amber-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
              </TableCell>
              <TableCell>{record.timeRecorded}</TableCell>
              <TableCell>
                <div className="max-w-[300px] truncate">
                  {record.excuseReason && (
                    <p className="italic text-muted-foreground text-xs">
                      Excuse: {record.excuseReason}
                    </p>
                  )}
                  {record.notes && (
                    <p className="truncate text-xs">
                      {record.notes}
                    </p>
                  )}
                  {!record.notes && !record.excuseReason && "—"}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteRecord(record)}
                >
                  <Trash2Icon className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AttendanceTable;
