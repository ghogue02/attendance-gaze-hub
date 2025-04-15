
import { UserCheck, UserX, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { TIMEZONE } from '@/utils/date/dateUtils';
import { BuilderStatus } from './types';

export const getStatusColor = (status: BuilderStatus) => {
  switch (status) {
    case 'present':
      return 'bg-green-50 text-green-600 border-green-200';
    case 'absent':
      return 'bg-red-50 text-red-600 border-red-200';
    case 'excused':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'pending':
      return 'bg-yellow-50 text-yellow-600 border-yellow-200';
    case 'late':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

export const getStatusIcon = (status: BuilderStatus) => {
  switch (status) {
    case 'present':
      return <UserCheck className="w-4 h-4" />;
    case 'absent':
    case 'excused':
      return <UserX className="w-4 h-4" />;
    case 'pending':
    case 'late':
      return <Clock className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

export const formatDate = (dateStr: string) => {
  try {
    if (!dateStr) return '';
    
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JS months are 0-based
    const day = parseInt(parts[2]);
    
    const date = new Date(year, month, day);
    return format(date, 'MMM d, yyyy');
  } catch (e) {
    console.error('Error formatting date:', e, dateStr);
    return dateStr;
  }
};

// Format ISO date string to Eastern Time
export const formatISOToEasternTime = (isoString: string | null | undefined): string => {
  if (!isoString) return '';
  
  try {
    const date = parseISO(isoString);
    return formatInTimeZone(date, TIMEZONE, 'h:mm a');
  } catch (e) {
    console.error('Error formatting ISO to Eastern time:', e);
    return '';
  }
};
