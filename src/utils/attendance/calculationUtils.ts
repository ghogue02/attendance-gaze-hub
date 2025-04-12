
// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');
const APRIL_4_2025 = '2025-04-04';
const APRIL_11_2025 = '2025-04-11';

// Record type that has the minimum fields needed for calculation
interface AttendanceBaseRecord {
  date: string;
  status?: string;
}

interface DetailedAttendanceResult {
  rate: number;
  presentDays: number;
  totalDays: number;
}

/**
 * Calculates attendance rate based on a consistent formula:
 * 
 * Rate = (Days Present or Late) / (Total School Days excluding Fridays) * 100
 * 
 * @param builderRecords Attendance records for a specific builder
 * @param allRecords All attendance records (used to determine valid school days)
 * @param includeDetails Whether to return detailed stats or just the rate
 * @returns Attendance rate as a percentage (capped at 100%)
 */
export function calculateAttendanceRate(
  builderRecords: AttendanceBaseRecord[],
  allRecords: AttendanceBaseRecord[],
  includeDetails: boolean = false
): number | DetailedAttendanceResult {
  // Create a Set of all valid class dates (excluding Fridays, special dates, and dates before min date)
  const allValidDates = new Set<string>();
  
  allRecords.forEach(record => {
    const recordDate = new Date(record.date);
    const isFriday = recordDate.getDay() === 5; // Friday is day 5 (0-indexed, Sunday is 0)
    const isApril4th = record.date === APRIL_4_2025;
    const isApril11th = record.date === APRIL_11_2025;
    const isBeforeMinDate = recordDate < MINIMUM_DATE;
    
    // Only add valid class dates to our set
    if (!isFriday && !isApril4th && !isApril11th && !isBeforeMinDate) {
      allValidDates.add(record.date);
    }
  });
  
  const validClassDates = Array.from(allValidDates);
  
  // If no valid class dates, return 0% attendance
  if (validClassDates.length === 0) {
    return includeDetails ? { rate: 0, presentDays: 0, totalDays: 0 } : 0;
  }
  
  // Count days when student was present or late from their records
  const presentOrLateDays = builderRecords.filter(record => {
    const recordDate = new Date(record.date);
    const isFriday = recordDate.getDay() === 5;
    const isApril4th = record.date === APRIL_4_2025;
    const isApril11th = record.date === APRIL_11_2025;
    const isBeforeMinDate = recordDate < MINIMUM_DATE;
    const isValidDate = !isFriday && !isApril4th && !isApril11th && !isBeforeMinDate;
    
    return isValidDate && (record.status === 'present' || record.status === 'late');
  }).length;
  
  // Calculate attendance rate based on total school days
  // Cap the rate at 100% maximum
  const rate = Math.min(100, Math.round((presentOrLateDays / validClassDates.length) * 100));
  
  console.log(`Attendance calculation: ${presentOrLateDays} present days / ${validClassDates.length} total days = ${rate}%`);
  
  // Return either just the rate or detailed statistics
  if (includeDetails) {
    return {
      rate,
      presentDays: presentOrLateDays,
      totalDays: validClassDates.length
    };
  }
  
  return rate;
}
