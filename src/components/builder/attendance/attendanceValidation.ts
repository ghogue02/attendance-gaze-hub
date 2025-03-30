
import { format, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';

// Minimum allowed date - Saturday, March 15, 2025
export const MINIMUM_DATE = new Date('2025-03-15');

export const validateAttendanceDate = (dateString: string, existingDates: string[]): boolean => {
  try {
    const date = new Date(dateString);
    
    // Check if it's a valid date
    if (isNaN(date.getTime())) {
      toast.error('Invalid date format');
      return false;
    }
    
    // Check if it's after minimum date
    if (isBefore(date, MINIMUM_DATE)) {
      toast.error(`Date must be on or after ${format(MINIMUM_DATE, 'MMM d, yyyy')}`);
      return false;
    }
    
    // Check if it's not in the future
    if (isAfter(date, new Date())) {
      toast.error('Cannot add attendance for future dates');
      return false;
    }
    
    // Check if the date already exists in attendance history
    if (existingDates.includes(dateString)) {
      toast.error('Attendance record already exists for this date');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Date validation error:', error);
    toast.error('Invalid date');
    return false;
  }
};
