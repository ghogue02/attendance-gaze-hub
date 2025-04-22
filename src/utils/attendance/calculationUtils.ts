
// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE_UTC = Date.UTC(2025, 2, 15); // Use UTC timestamp for consistency

// Define holidays - dates when we don't have class
const HOLIDAY_DATES = new Set([
  '2025-04-20' // Easter Sunday
]);

// Global debug flag - set to false to reduce console noise
const DEBUG_LOGGING = false;

/**
 * Check if a date is a holiday
 */
const isHoliday = (dateString: string): boolean => {
  return HOLIDAY_DATES.has(dateString);
};

/**
 * Calculates attendance statistics based on a defined period and rules.
 * 
 * Assumes class days are EVERY DAY EXCEPT FRIDAY AND SUNDAY between the start date (inclusive)
 * and current date (inclusive).
 * 
 * Rate = (Days Present or Late) / (Total Days Excluding Fridays, Sundays, and Holidays between Start and Current Date) * 100
 * 
 * @param attendanceRecords Attendance records for a specific builder
 * @returns An object containing the rate, present count, and total class days.
 */
export function calculateAttendanceStatistics(
  attendanceRecords: { date: string; status?: string; student_id?: string }[]
) {
  // --- Log Inputs ---
  const studentId = attendanceRecords.length > 0 ? attendanceRecords[0].student_id : 'Unknown';
  const studentName = attendanceRecords.length > 0 && 
                      attendanceRecords[0].student_id === "c80ac741-bee0-441d-aa3b-02aafa3dc018" ? "Saeed" : "";
  
  const isSaeed = studentName === "Saeed" || 
                  studentId === "c80ac741-bee0-441d-aa3b-02aafa3dc018";
  
  if (DEBUG_LOGGING && isSaeed) {
    console.log(`[calculateAttendanceStatistics] Calculating for Saeed (${studentId}). Received ${attendanceRecords.length} records.`);
    console.log(`[calculateAttendanceStatistics] Input records for Saeed:`, attendanceRecords);
  }
  
  // Filter out holiday dates from attendance records 
  const filteredAttendanceRecords = attendanceRecords.filter(record => !isHoliday(record.date));
  
  if (DEBUG_LOGGING && isSaeed && attendanceRecords.length !== filteredAttendanceRecords.length) {
    console.log(`[calculateAttendanceStatistics] Filtered out ${attendanceRecords.length - filteredAttendanceRecords.length} holiday records`);
  }
  
  // Get current date components in UTC
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const currentDay = now.getUTCDate();
  
  // Use Date.UTC for consistent UTC timestamps
  const currentDateUTC = Date.UTC(currentYear, currentMonth, currentDay);

  // Start date is March 15, 2025 (UTC)
  const startDateUTC = MINIMUM_DATE_UTC;
  
  if (DEBUG_LOGGING && isSaeed) {
    console.log(`[calculateAttendanceStatistics] Start Date UTC: ${new Date(startDateUTC).toISOString()}`);
    console.log(`[calculateAttendanceStatistics] Current Date UTC: ${new Date(currentDateUTC).toISOString()}`);
  }
  
  // Edge Case: If current date is before the start date, return zeros.
  if (currentDateUTC < startDateUTC) {
    console.warn("Current date is before the minimum start date.");
    return { rate: 0, presentCount: 0, totalClassDays: 0 };
  }
  
  // --- Calculate Denominator (Total Class Days: Every day EXCEPT Friday, Sunday and Holidays) ---
  let totalClassDays = 0;
  let classDates: string[] = []; // Track all class dates for debugging
  
  // Iterate day by day from startDateUTC up to and including currentDateUTC
  const tempDate = new Date(startDateUTC);
  let iteration = 0; // Safety check
  
  if (DEBUG_LOGGING && isSaeed) {
    console.log(`[calculateAttendanceStatistics] Starting Day Calculation Loop...`);
  }
  
  const countedDates = DEBUG_LOGGING && isSaeed ? [] : null;
  
  while (tempDate.getTime() <= currentDateUTC && iteration < 1000) {
    const dayOfWeek = tempDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dateString = tempDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Count the day if it's NOT a Friday AND NOT a Sunday AND NOT a holiday
    if (dayOfWeek !== 5 && dayOfWeek !== 0 && !isHoliday(dateString)) {
      totalClassDays++;
      if (classDates) classDates.push(dateString);
      if (DEBUG_LOGGING && countedDates) countedDates.push(dateString);
      
      if (DEBUG_LOGGING && isSaeed) {
        console.log(`[calculateAttendanceStatistics] Counted Day (Saeed): ${dateString}, DayOfWeek: ${dayOfWeek}, New Total: ${totalClassDays}`);
      }
    } else if (DEBUG_LOGGING && isSaeed) {
      let skipReason = "Unknown";
      if (dayOfWeek === 5) skipReason = 'Friday';
      else if (dayOfWeek === 0) skipReason = 'Sunday';
      else if (isHoliday(dateString)) skipReason = 'Holiday';
      
      console.log(`[calculateAttendanceStatistics] Skipped ${skipReason}: ${dateString}`);
    }
    
    // Move to the next day in UTC
    tempDate.setUTCDate(tempDate.getUTCDate() + 1);
    iteration++;
  }
  
  if (iteration >= 1000) {
    console.error("[calculateAttendanceStatistics] Loop exceeded max iterations!");
  }
  
  if (DEBUG_LOGGING || totalClassDays > 32) { // Added condition to log when total class days > 32
    console.log(`[calculateAttendanceStatistics] Total class days counted: ${totalClassDays}`);
    console.log(`[calculateAttendanceStatistics] All class dates:`, classDates);
    console.log(`[calculateAttendanceStatistics] Date range: ${new Date(startDateUTC).toISOString().split('T')[0]} to ${new Date(currentDateUTC).toISOString().split('T')[0]}`);
  }
  
  // --- Calculate Numerator (Present or Late Days) ---
  const presentOrLateRecords = filteredAttendanceRecords.filter(record => {
    const isPresentOrLate = record.status === 'present' || record.status === 'late';
    
    if (DEBUG_LOGGING && isSaeed) {
      console.log(`[calculateAttendanceStatistics] Filtering record (Saeed): Date=${record.date}, Status=${record.status}, IsPresentOrLate=${isPresentOrLate}`);
    }
    
    return isPresentOrLate;
  });
  
  const presentOrLateDays = presentOrLateRecords.length;
  
  if (DEBUG_LOGGING && isSaeed) {
    console.log(`[calculateAttendanceStatistics] Filtered Present/Late Records (Saeed):`, presentOrLateRecords);
    console.log(`[calculateAttendanceStatistics] Final presentOrLateDays = ${presentOrLateDays}`);
  }
  
  // --- Calculate Rate ---
  let rate = 0;
  if (totalClassDays > 0) {
    // Calculate the rate - cap it at 100% to prevent values over 100%
    rate = Math.min(100, Math.round((presentOrLateDays / totalClassDays) * 100));
  }
  
  // Ensure rate, presentCount, and totalClassDays are accurate
  const result = {
    rate,
    presentCount: presentOrLateDays,
    totalClassDays,
  };
  
  if (DEBUG_LOGGING || presentOrLateDays > totalClassDays) {
    console.log(`[calculateAttendanceStatistics] Student ID: ${studentId}`);
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
