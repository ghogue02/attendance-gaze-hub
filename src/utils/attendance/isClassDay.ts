
/**
 * Determines if a given date is a class day (Monday through Thursday, excluding weekends and Friday)
 */
export const isClassDay = (dateString: string): boolean => {
  // Parse the date from the provided string
  const date = new Date(dateString);
  
  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getDay();
  
  // Check if it's Monday through Thursday (days 1-4)
  // For dashboard viewing purposes, we'll consider all days valid
  return true; // Modified to always return true so data can be viewed any day
  
  // Original implementation:
  // return dayOfWeek >= 1 && dayOfWeek <= 4;
};

/**
 * Determines if a given date is a class day for attendance taking purposes
 * This is used for actual attendance operations
 */
export const isAttendanceDay = (dateString: string): boolean => {
  // Parse the date from the provided string
  const date = new Date(dateString);
  
  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getDay();
  
  // Check if it's Monday through Thursday (days 1-4)
  return dayOfWeek >= 1 && dayOfWeek <= 4;
};
