
import { useState } from 'react';
import { format } from 'date-fns';
import { X, CalendarIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuilderStatus } from '@/components/builder/types';

interface AttendanceFiltersProps {
  dateFilter: string | null;
  statusFilter: BuilderStatus | 'all';
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  setDateFilter: (date: string | null) => void;
  setStatusFilter: (status: BuilderStatus | 'all') => void;
  clearDateFilter: () => void;
  clearStatusFilter: () => void;
  clearAllFilters: () => void;
  calendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;
  fromDate: Date;
  toDate: Date;
  hasActiveFilters: boolean;
}

const AttendanceFilters = ({
  dateFilter,
  statusFilter,
  date,
  setDate,
  setDateFilter,
  setStatusFilter,
  clearDateFilter,
  clearStatusFilter,
  clearAllFilters,
  calendarOpen,
  setCalendarOpen,
  fromDate,
  toDate,
  hasActiveFilters
}: AttendanceFiltersProps) => {
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

  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium">Attendance Records</h3>
      <div className="flex gap-2 items-center">
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAllFilters}
            className="h-9 gap-1"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear all filters</span>
          </Button>
        )}
        
        {dateFilter && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearDateFilter}
            className="h-9 gap-1"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear date: {date ? format(date, 'MMM d, yyyy') : ''}</span>
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
        
        <Select 
          value={statusFilter} 
          onValueChange={(value) => setStatusFilter(value as any)}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="excused">Excused</SelectItem>
            <SelectItem value="late">Late</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AttendanceFilters;
