
// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE_UTC = Date.UTC(2025, 2, 15); // Use UTC timestamp for consistency

/**
 * Calculates attendance statistics based on a defined period and rules.
 * 
 * Assumes class days are EVERY DAY EXCEPT FRIDAY between the start date (inclusive)
 * and current date (inclusive).
 * 
 * Rate = (Days Present or Late) / (Total Days Excluding Fridays between Start and Current Date) * 100
 * 
 * @param attendanceRecords Attendance records for a specific builder
 * @returns An object containing the rate, present count, and total class days.
 */
export function calculateAttendanceStatistics(
  attendanceRecords: { date: string; status?: string }[]
) {
  // Get current date components in UTC
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const currentDay = now.getUTCDate();
  
  // Use Date.UTC for consistent UTC timestamps
  const currentDateUTC = Date.UTC(currentYear, currentMonth, currentDay);

  // Start date is March 15, 2025 (UTC)
  const startDateUTC = MINIMUM_DATE_UTC;
  
  // Edge Case: If current date is before the start date, return zeros.
  if (currentDateUTC < startDateUTC) {
    console.warn("Current date is before the minimum start date.");
    return { rate: 0, presentCount: 0, totalClassDays: 0 };
  }
  
  // --- Calculate Denominator (Total Class Days: Every day EXCEPT Friday) ---
  let totalClassDays = 0;
  
  // Iterate day by day from startDateUTC up to and including currentDateUTC
  const tempDate = new Date(startDateUTC);
  
  while (tempDate.getTime() <= currentDateUTC) {
    const dayOfWeek = tempDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Count the day if it's NOT a Friday (day 5)
    if (dayOfWeek !== 5) {
      totalClassDays++;
    }
    
    // Move to the next day in UTC
    tempDate.setUTCDate(tempDate.getUTCDate() + 1);
  }
  
  // --- Calculate Numerator (Present or Late Days) ---
  const presentOrLateDays = attendanceRecords.filter(record => 
    record.status === 'present' || record.status === 'late'
  ).length;
  
  // --- Calculate Rate ---
  let rate = 0;
  if (totalClassDays > 0) {
    // Calculate the rate and cap it at 100%
    rate = Math.min(100, Math.round((presentOrLateDays / totalClassDays) * 100));
  }
  
  console.log(`Attendance calculation: Present/Late days: ${presentOrLateDays}, Total Class Days (Excl. Fridays): ${totalClassDays}, Rate: ${rate}%`);
  
  return {
    rate,
    presentCount: presentOrLateDays,
    totalClassDays,
  };
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
