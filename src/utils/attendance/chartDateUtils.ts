
import { subDays, isAfter } from 'date-fns';
import { parseAsEastern, getCurrentDateString } from '@/utils/date/dateUtils';
import { isClassDaySync } from '@/utils/attendance/isClassDay';

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');

// Helper to log date debugging info
export const logDateDebug = (dateStr: string, message: string): void => {
  const date = parseAsEastern(dateStr);
  console.log(`${message}: ${dateStr} - Eastern Day: ${date.getDay()} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]})`);
};

export const calculateDateRange = (days: number) => {
  // Use the actual current date in Eastern Time as the end date
  const currentDateStr = getCurrentDateString();
  const endDate = parseAsEastern(currentDateStr);
  
  console.log(`[chartDateUtils] Using current Eastern date as end date: ${currentDateStr}`);
  
  // Calculate start date based on the current date in Eastern Time
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
  
  // Generate all dates in the range using Eastern Time
  const startDateObj = parseAsEastern(startDate);
  const endDateObj = parseAsEastern(endDate);
  
  // Loop through each date in the range and add to the map
  const currentDate = new Date(startDateObj);
  while (currentDate <= endDateObj) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Use the centralized class day logic instead of hardcoded day checks
    if (isClassDaySync(dateStr)) {
      dateMap.set(dateStr, {
        Present: 0,
        Late: 0,
        Absent: 0,
        Excused: 0
      });
      logDateDebug(dateStr, `Added to chart`);
    } else {
      logDateDebug(dateStr, `Excluding non-class day from chart`);
    }
    
    // Move to next day - add exactly 24 hours to ensure consistency
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`Generated date map with ${dateMap.size} valid class days`);
  return dateMap;
};
