
// Define holidays - dates when we don't have class
const HOLIDAY_DATES = new Set([
  '2025-04-20' // Easter Sunday
]);

// Define problematic dates - Fridays we don't have class
const PROBLEMATIC_DATES = new Set([
  '2025-04-18', // Good Friday
  '2025-04-11', // Friday
  '2025-04-04'  // Friday
]);

export const isHolidayOrProblematic = (dateString: string): boolean => {
  return HOLIDAY_DATES.has(dateString) || PROBLEMATIC_DATES.has(dateString);
};

export const shouldSkipDate = (dateString: string): boolean => {
  return isHolidayOrProblematic(dateString);
};
