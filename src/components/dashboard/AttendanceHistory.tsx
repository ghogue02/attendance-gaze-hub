
import { memo, useState } from 'react';
import { Builder } from '@/components/builder/types';
import { useAttendanceHistory } from './useAttendanceHistory';
import AttendanceLoadingState from './AttendanceLoadingState';
import AttendanceEmptyState from './AttendanceEmptyState';
import AttendanceTable from './AttendanceTable';
import DeleteAttendanceDialog from './DeleteAttendanceDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AttendanceHistoryProps {
  builders: Builder[];
  onError: (message: string) => void;
}

const AttendanceHistory = memo(({ builders, onError }: AttendanceHistoryProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const {
    attendanceRecords,
    isLoading,
    deleteDialogOpen,
    dateFilter,
    setDateFilter,
    formatDate,
    handleDeleteRecord,
    confirmDelete,
    closeDeleteDialog
  } = useAttendanceHistory(onError);
  
  // Handle date selection
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      setDateFilter(formattedDate);
    } else {
      setDateFilter(null);
    }
    setCalendarOpen(false);
  };
  
  // Clear date filter
  const clearDateFilter = () => {
    setDate(undefined);
    setDateFilter(null);
  };
  
  // Determine earliest valid date (March 15, 2025)
  const fromDate = new Date('2025-03-15');
  const toDate = new Date(); // Today
  
  if (isLoading) {
    return <AttendanceLoadingState />;
  }
  
  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Attendance Records</h3>
          <div className="flex gap-2 items-center">
            {dateFilter && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearDateFilter}
                className="h-9 gap-1"
              >
                <X className="h-3.5 w-3.5" />
                <span>Clear filter: {date ? format(date, 'MMM d, yyyy') : ''}</span>
              </Button>
            )}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>Filter by date</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  disabled={(date) => 
                    date > toDate || date < fromDate
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {attendanceRecords.length === 0 ? (
          <AttendanceEmptyState dateFiltered={!!dateFilter} />
        ) : (
          <AttendanceTable 
            attendanceRecords={attendanceRecords}
            formatDate={formatDate}
            onDeleteRecord={handleDeleteRecord}
          />
        )}
      </div>
      
      <DeleteAttendanceDialog
        isOpen={deleteDialogOpen}
        isLoading={isLoading}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
      />
    </>
  );
});

AttendanceHistory.displayName = 'AttendanceHistory';

export default AttendanceHistory;
