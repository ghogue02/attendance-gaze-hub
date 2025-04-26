
/**
 * Determines if a given date is a class day (Monday through Thursday, excluding weekends and Friday)
 * This function always returns true for dashboard viewing purposes so data can be viewed any day
 */
export const isClassDay = (dateString: string): boolean => {
  // For dashboard viewing purposes, we'll consider all days valid
  // This allows viewing the dashboard data on any day, including weekends and Fridays
  return true;
};

/**
 * Determines if a given date is a class day for attendance taking purposes
 * This is used for actual attendance operations and filtering
 */
export const isAttendanceDay = (dateString: string): boolean => {
  // Parse the date from the provided string, ensuring UTC interpretation
  const date = new Date(dateString + 'T00:00:00Z');
  
  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getUTCDay();
  
  // Specific date exclusions (holidays, etc.)
  const excludedDates = [
    '2025-04-20', // Easter Sunday
  ];
  
  // Check if the date is excluded
  if (excludedDates.includes(dateString)) {
    return false;
  }
  
  // Check if it's Monday through Thursday (days 1-4)
  return dayOfWeek >= 1 && dayOfWeek <= 4;
};
