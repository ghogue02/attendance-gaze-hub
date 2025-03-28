
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PencilIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AttendanceRecord } from './types';
import { getStatusColor, formatDate } from './BuilderCardUtils';

interface AttendanceHistoryTableProps {
  attendanceHistory: AttendanceRecord[];
  isLoading: boolean;
  onEditRecord: (record: AttendanceRecord) => void;
}

const AttendanceHistoryTable = ({ 
  attendanceHistory, 
  isLoading, 
  onEditRecord 
}: AttendanceHistoryTableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (attendanceHistory.length === 0) {
    return (
      <p className="text-center py-6 text-muted-foreground">No attendance records found for this builder.</p>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-12"></TableHead>
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
                  onClick={() => onEditRecord(record)}
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
  );
};

export default AttendanceHistoryTable;
