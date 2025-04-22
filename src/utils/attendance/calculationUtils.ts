
// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE_UTC = Date.UTC(2025, 2, 15); // Use UTC timestamp for consistency

// Define holidays - dates when we don't have class
const HOLIDAY_DATES = new Set([
  '2025-04-20' // Easter Sunday
]);

// Add April 18th, 2025 explicitly to the problematic dates for clarity
const PROBLEMATIC_DATES = new Set([
  '2025-04-18', // Good Friday - explicitly excluded
  '2025-04-04',
  '2025-04-11'
]);

// Global debug flag - set to true for debugging this issue
const DEBUG_LOGGING = true;

/**
 * Check if a date is a holiday
 */
const isHoliday = (dateString: string): boolean => {
  return HOLIDAY_DATES.has(dateString);
};

/**
 * Check if a date is explicitly problematic (specific Fridays we want to exclude)
 */
const isProblematicDate = (dateString: string): boolean => {
  return PROBLEMATIC_DATES.has(dateString);
};

/**
 * Check if a date is a valid class day (not Friday, not a holiday, not problematic)
 * NOTE: Sundays ARE valid class days except for holidays
 */
const isValidClassDay = (dateObj: Date, dateString: string): boolean => {
  const dayOfWeek = dateObj.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return dayOfWeek !== 5 && !isHoliday(dateString) && !isProblematicDate(dateString);
};

/**
 * Calculates attendance statistics based on a defined period and rules.
 * 
 * Assumes class days are EVERY DAY EXCEPT FRIDAY between the start date (inclusive)
 * and current date (inclusive). Sundays ARE counted as class days except for holidays.
 * 
 * Rate = (Days Present or Late) / (Total Days Excluding Fridays and Holidays between Start and Current Date) * 100
 * 
 * @param attendanceRecords Attendance records for a specific builder
 * @returns An object containing the rate, present count, and total class days.
 */
export function calculateAttendanceStatistics(
  attendanceRecords: { date: string; status?: string; student_id?: string }[]
) {
  // --- Log Inputs ---
  const studentId = attendanceRecords.length > 0 ? attendanceRecords[0].student_id : 'Unknown';
  
  if (DEBUG_LOGGING) {
    console.log(`[calculateAttendanceStatistics] Calculating for student ID: ${studentId}. Received ${attendanceRecords.length} records.`);
  }
  
  // Filter out holiday dates from attendance records and problematic dates
  const allAttendanceDates = new Set(attendanceRecords.map(record => record.date));
  const filteredAttendanceRecords = attendanceRecords.filter(record => 
    !isHoliday(record.date) && !isProblematicDate(record.date)
  );
  
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
    return { rate: 0, presentCount: 0, totalClassDays: 0 };
  }
  
  // --- Calculate Denominator (Total Class Days: Every day EXCEPT Friday and Holidays) ---
  let totalClassDays = 0;
  let classDates: string[] = []; // Track all class dates for debugging
  
  // Iterate day by day from startDateUTC up to and including currentDateUTC
  const tempDate = new Date(startDateUTC);
  let iteration = 0; // Safety check
  
  if (DEBUG_LOGGING) {
    console.log(`[calculateAttendanceStatistics] Starting Day Calculation Loop...`);
  }
  
  while (tempDate.getTime() <= currentDateUTC && iteration < 100) {
    const dayOfWeek = tempDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dateString = tempDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Count the day if it's a valid class day (not Friday, not holiday, not problematic)
    // Note: Sundays ARE now counted as class days except for holidays
    if (isValidClassDay(tempDate, dateString)) {
      totalClassDays++;
      if (DEBUG_LOGGING) classDates.push(dateString);
      
      if (DEBUG_LOGGING) {
        console.log(`[calculateAttendanceStatistics] Counted Day: ${dateString}, DayOfWeek: ${dayOfWeek}, TotalDays: ${totalClassDays}`);
      }
    } else if (DEBUG_LOGGING) {
      let skipReason = "Unknown";
      if (dayOfWeek === 5) skipReason = 'Friday';
      else if (isHoliday(dateString)) skipReason = 'Holiday';
      else if (isProblematicDate(dateString)) skipReason = 'Problematic Date';
      
      console.log(`[calculateAttendanceStatistics] Skipped ${skipReason}: ${dateString}`);
    }
    
    // Move to the next day in UTC
    tempDate.setUTCDate(tempDate.getUTCDate() + 1);
    iteration++;
  }
  
  // --- Calculate Numerator (Present or Late Days) ---
  // Only count present/late days that are on valid class days (not Fridays or holidays)
  const presentOrLateRecords = filteredAttendanceRecords.filter(record => {
    // Check if this is a valid class day
    const recordDate = new Date(record.date);
    const dateString = record.date;
    const isClassDay = isValidClassDay(recordDate, dateString);
    
    // Only count present or late records on valid class days 
    const isPresentOrLate = (record.status === 'present' || record.status === 'late') && isClassDay;
    
    if (DEBUG_LOGGING) {
      console.log(`[calculateAttendanceStatistics] Filtering record: Date=${record.date}, Status=${record.status}, IsValidClassDay=${isClassDay}, IsPresentOrLate=${isPresentOrLate}`);
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
    // If the student has attended all classes, set rate to 100%
    if (presentOrLateDays >= totalClassDays) {
      rate = 100;
    } else {
      // Otherwise calculate the percentage
      rate = Math.round((presentOrLateDays / totalClassDays) * 100);
    }
  }
  
  // Ensure rate, presentCount, and totalClassDays are accurate
  const result = {
    rate,
    presentCount: presentOrLateDays,
    totalClassDays,
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
