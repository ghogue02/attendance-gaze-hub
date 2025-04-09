
import { AttendanceRecord } from './AttendanceTypes';
import AttendanceLoadingState from './AttendanceLoadingState';
import AttendanceEmptyState from './AttendanceEmptyState';
import AttendanceTable from './AttendanceTable';
import AttendanceFilters from './AttendanceFilters';
import AttendanceCopyOptions from './AttendanceCopyOptions';
import { format } from 'date-fns';

interface AttendanceHistoryContentProps {
  attendanceRecords: AttendanceRecord[];
  isLoading: boolean;
  dateFilter: string | null;
  statusFilter: string;
  setDateFilter: (date: string | null) => void;
  setStatusFilter: (status: any) => void;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  calendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;
  fromDate: Date;
  toDate: Date;
  formatDate: (date: string) => string;
  onDeleteRecord: (record: AttendanceRecord) => void;
  onNavigateToBuilder: (record: AttendanceRecord) => void;
  hasActiveFilters: boolean;
  clearDateFilter: () => void;
  clearStatusFilter: () => void;
  clearAllFilters: () => void;
}

const AttendanceHistoryContent = ({
  attendanceRecords,
  isLoading,
  dateFilter,
  statusFilter,
  setDateFilter,
  setStatusFilter,
  date,
  setDate,
  calendarOpen,
  setCalendarOpen,
  fromDate,
  toDate,
  formatDate,
  onDeleteRecord,
  onNavigateToBuilder,
  hasActiveFilters,
  clearDateFilter,
  clearStatusFilter,
  clearAllFilters
}: AttendanceHistoryContentProps) => {
  
  if (isLoading) {
    return <AttendanceLoadingState />;
  }
  
  if (attendanceRecords.length === 0) {
    return (
      <AttendanceEmptyState 
        dateFiltered={!!dateFilter}
        statusFiltered={statusFilter !== 'all'}
      />
    );
  }
  
  return (
    <div className="space-y-4">
      <AttendanceFilters 
        dateFilter={dateFilter}
        statusFilter={statusFilter as any}
        setDateFilter={setDateFilter}
        setStatusFilter={setStatusFilter}
        date={date}
        setDate={setDate}
        calendarOpen={calendarOpen}
        setCalendarOpen={setCalendarOpen}
        clearDateFilter={clearDateFilter}
        clearStatusFilter={clearStatusFilter}
        clearAllFilters={clearAllFilters}
        fromDate={fromDate}
        toDate={toDate}
        hasActiveFilters={hasActiveFilters}
      />
      
      <AttendanceTable 
        attendanceRecords={attendanceRecords}
        formatDate={formatDate}
        onDeleteRecord={onDeleteRecord}
        onNavigateToBuilder={onNavigateToBuilder}
      />
      
      <AttendanceCopyOptions 
        attendanceRecords={attendanceRecords}
        formatDate={formatDate}
        dateFilter={dateFilter}
      />
    </div>
  );
};

export default AttendanceHistoryContent;
