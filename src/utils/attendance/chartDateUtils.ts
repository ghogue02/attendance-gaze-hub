
import { subDays, isAfter } from 'date-fns';
import { parseAsUTC, getCurrentDateString } from '@/utils/date/dateUtils';

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');

// Define holidays - dates when we don't have class
const HOLIDAY_DATES = new Set([
  '2025-04-20' // Easter Sunday
]);

// Helper to log date debugging info
export const logDateDebug = (dateStr: string, message: string): void => {
  const date = parseAsUTC(dateStr);
  console.log(`${message}: ${dateStr} - UTC Day: ${date.getUTCDay()} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getUTCDay()]})`);
};

// Helper to check if a date is a holiday
export const isHoliday = (dateString: string): boolean => {
  return HOLIDAY_DATES.has(dateString);
};

export const calculateDateRange = (days: number) => {
  // Use the actual current date as the end date
  const currentDateStr = getCurrentDateString();
  const endDate = parseAsUTC(currentDateStr);
  
  console.log(`[chartDateUtils] Using current date as end date: ${currentDateStr}`);
  
  // Calculate start date based on the current date
  const startDate = subDays(endDate, days - 1);
  
  // Ensure start date is not before the minimum date (March 15, 2025)
  const adjustedStartDate = isAfter(startDate, MINIMUM_DATE) ? startDate : MINIMUM_DATE;
  
  // Format back to YYYY-MM-DD strings for the query
  const formatToYYYYMMDD = (date: Date): string => date.toISOString().split('T')[0];
  
  const range = {
    start: formatToYYYYMMDD(adjustedStartDate),
    end: formatToYYYYMMDD(endDate)
  };
  
  console.log(`[chartDateUtils] Calculated date range for ${days} days:`, range);
  console.log(`[chartDateUtils] Start date adjusted from ${formatToYYYYMMDD(startDate)} to ${range.start} due to minimum date constraint`);
  return range;
};

export const generateDateMap = (startDate: string, endDate: string): Map<string, { Present: number; Late: number; Absent: number; Excused: number }> => {
  const dateMap = new Map<string, { Present: number; Late: number; Absent: number; Excused: number }>();
  
  console.log(`Generating date map from ${startDate} to ${endDate}`);
  
  // Generate all dates in the range - completely recreated to ensure consistency
  const startDateObj = parseAsUTC(startDate);
  const endDateObj = parseAsUTC(endDate);
  
  // Loop through each date in the range and add to the map
  const currentDate = new Date(startDateObj);
  while (currentDate <= endDateObj) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const checkDate = parseAsUTC(dateStr);
    const dayOfWeek = checkDate.getUTCDay(); // Use UTC day
    
    // Skip Fridays (UTC day 5), Thursdays (UTC day 4) and Holidays
    if (dayOfWeek !== 5 && dayOfWeek !== 4 && !isHoliday(dateStr)) {
      dateMap.set(dateStr, {
        Present: 0,
        Late: 0,
        Absent: 0,
        Excused: 0
      });
      logDateDebug(dateStr, `Added to chart`);
    } else {
      const skipReason = dayOfWeek === 5 ? 'Friday' : dayOfWeek === 4 ? 'Thursday' : 'Holiday';
      logDateDebug(dateStr, `Excluding ${skipReason} from chart`);
    }
    
    // Move to next day - add exactly 24 hours to ensure UTC consistency
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  
  console.log(`Generated date map with ${dateMap.size} valid class days`);
  return dateMap;
};
