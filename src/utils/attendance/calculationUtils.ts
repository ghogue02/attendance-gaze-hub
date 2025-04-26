// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE_UTC = Date.UTC(2025, 2, 15); // Use UTC timestamp for consistency

// Import our canonical helper for class day determination
import { isClassDay } from './isClassDay';

// Global debug flag - set to true for debugging this issue
const DEBUG_LOGGING = true;

// Define a consistent return type that always includes hasPerfectAttendance
interface AttendanceStats {
  rate: number;
  presentCount: number;
  totalClassDays: number;
  hasPerfectAttendance: boolean;
}

/**
 * Calculates attendance statistics based on a defined period and rules.
 * 
 * Assumes class days follow the isClassDay helper logic between the start date (inclusive)
 * and current date (inclusive).
 * 
 * Rate = (Days Present or Late) / (Total Class Days between Start and Current Date) * 100
 * 
 * @param attendanceRecords Attendance records for a specific builder
 * @returns An object containing the rate, present count, and total class days.
 */
export function calculateAttendanceStatistics(
  attendanceRecords: { date: string; status?: string; student_id?: string }[]
): AttendanceStats {
  // --- Log Inputs ---
  const studentId = attendanceRecords.length > 0 ? attendanceRecords[0].student_id : 'Unknown';
  
  if (DEBUG_LOGGING) {
    console.log(`[calculateAttendanceStatistics] Calculating for student ID: ${studentId}. Received ${attendanceRecords.length} records.`);
  }
  
  // Filter out non-class days from attendance records using our canonical helper
  const filteredAttendanceRecords = attendanceRecords.filter(record => isClassDay(record.date));
  
  // Get current date components in UTC
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const currentDay = now.getUTCDate();
  
  // Use Date.UTC for consistent UTC timestamps
  const currentDateUTC = Date.UTC(currentYear, currentMonth, currentDay);

  // Start date is March 15, 2025 (UTC)
  const startDateUTC = MINIMUM_DATE_UTC;
  
  if (DEBUG_LOGGING) {
    console.log(`[calculateAttendanceStatistics] Start Date UTC: ${new Date(startDateUTC).toISOString()}`);
    console.log(`[calculateAttendanceStatistics] Current Date UTC: ${new Date(currentDateUTC).toISOString()}`);
  }
  
  // Edge Case: If current date is before the start date, return zeros.
  if (currentDateUTC < startDateUTC) {
    console.warn("Current date is before the minimum start date.");
    return { rate: 0, presentCount: 0, totalClassDays: 0, hasPerfectAttendance: false };
  }
  
  // --- Calculate Denominator (Total Class Days using isClassDay) ---
  let totalClassDays = 0;
  let classDates: string[] = []; // Track all class dates for debugging
  
  // Iterate day by day from startDateUTC up to and including currentDateUTC
  const tempDate = new Date(startDateUTC);
  let iteration = 0; // Safety check
  
  if (DEBUG_LOGGING) {
    console.log(`[calculateAttendanceStatistics] Starting Day Calculation Loop...`);
  }
  
  while (tempDate.getTime() <= currentDateUTC && iteration < 100) {
    const dateString = tempDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Use our canonical helper to determine if this is a class day
    if (isClassDay(dateString)) {
      totalClassDays++;
      if (DEBUG_LOGGING) classDates.push(dateString);
      
      if (DEBUG_LOGGING) {
        console.log(`[calculateAttendanceStatistics] Counted Day: ${dateString}, TotalDays: ${totalClassDays}`);
      }
    } else if (DEBUG_LOGGING) {
      console.log(`[calculateAttendanceStatistics] Skipped non-class day: ${dateString}`);
    }
    
    // Move to the next day in UTC
    tempDate.setUTCDate(tempDate.getUTCDate() + 1);
    iteration++;
  }
  
  // --- Calculate Numerator (Present or Late Days) ---
  // Only count present/late days that are on valid class days
  const presentOrLateRecords = filteredAttendanceRecords.filter(record => {
    // Check if this is a valid class day (redundant since we already filtered, but keeping for clarity)
    const isValidClassDay = isClassDay(record.date);
    
    // Only count present or late records on valid class days 
    const isPresentOrLate = (record.status === 'present' || record.status === 'late') && isValidClassDay;
    
    if (DEBUG_LOGGING) {
      console.log(`[calculateAttendanceStatistics] Filtering record: Date=${record.date}, Status=${record.status}, IsValidClassDay=${isValidClassDay}, IsPresentOrLate=${isPresentOrLate}`);
    }
    
    return isPresentOrLate;
  });
  
  const presentOrLateDays = presentOrLateRecords.length;
  
  if (DEBUG_LOGGING) {
    console.log(`[calculateAttendanceStatistics] Filtered Present/Late Records:`, presentOrLateRecords);
    console.log(`[calculateAttendanceStatistics] Final presentOrLateDays = ${presentOrLateDays}`);
  }
  
  // --- Calculate Rate ---
  let rate = 0;
  if (totalClassDays > 0) {
    // If the student has attended all or more days than required, set rate to 100%
    if (presentOrLateDays >= totalClassDays) {
      rate = 100;
    } else {
      // Otherwise calculate the percentage
      rate = Math.round((presentOrLateDays / totalClassDays) * 100);
    }
  }
  
  // Ensure rate, presentCount, and totalClassDays are accurate
  const result: AttendanceStats = {
    rate,
    presentCount: Math.min(presentOrLateDays, totalClassDays), // Cannot exceed total class days
    totalClassDays,
    // If they've attended all days, they have perfect attendance
    hasPerfectAttendance: presentOrLateDays >= totalClassDays 
  };
  
  if (DEBUG_LOGGING) {
    console.log(`[calculateAttendanceStatistics] Student ID: ${studentId}`);
    console.log(`[calculateAttendanceStatistics] Calculated: ${presentOrLateDays} present or late days out of ${totalClassDays} total class days`);
    console.log(`[calculateAttendanceStatistics] Final Result:`, result);
  }
  
  return result;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use calculateAttendanceStatistics instead
 */
export function calculateAttendanceRate(
  builderRecords: { date: string; status?: string }[]
): number {
  const stats = calculateAttendanceStatistics(builderRecords);
  return stats.rate;
}
