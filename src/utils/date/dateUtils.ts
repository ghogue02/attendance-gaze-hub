
/**
 * Utility functions for handling dates in the application
 */

/**
 * Returns the current date in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  const now = new Date();
  // Format as YYYY-MM-DD to avoid timezone issues
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * Returns a formatted display date string
 */
export const getDisplayDateString = (): string => {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

/**
 * Logs date information for debugging
 */
export const logDateDebugInfo = (context: string, dateString: string): void => {
  console.log(`[${context}] Current date string: ${dateString}`);
};
