
// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');

/**
 * Calculates attendance rate based on the specified formula:
 * 
 * Rate = (Days Present or Late) / (Total days between March 15, 2025 and Present day - Total Fridays) * 100
 * 
 * @param builderRecords Attendance records for a specific builder
 * @returns Attendance rate as a percentage (capped at 100%)
 */
export function calculateAttendanceRate(
  builderRecords: { date: string; status?: string }[]
): number {
  // Get current date for the calculation
  const currentDate = new Date();
  
  // Start date is March 15, 2025
  const startDate = new Date(MINIMUM_DATE);
  
  // Calculate total days between start date and current date
  const totalDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Count the Fridays between the start date and current date
  let fridayCount = 0;
  const tempDate = new Date(startDate);
  while (tempDate <= currentDate) {
    if (tempDate.getDay() === 5) { // 5 = Friday
      fridayCount++;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }
  
  // Calculate denominator: Total days minus Fridays
  const denominator = totalDays - fridayCount;
  
  // Log the calculation components for debugging
  console.log(`Attendance calculation: Total days: ${totalDays}, Friday count: ${fridayCount}, Denominator: ${denominator}`);
  
  // Count days when student was present or late
  const presentOrLateDays = builderRecords.filter(record => {
    return (record.status === 'present' || record.status === 'late');
  }).length;
  
  // Calculate attendance rate based on the formula
  // Cap the rate at 100% maximum
  const rate = Math.min(100, Math.round((presentOrLateDays / denominator) * 100) || 0);
  
  console.log(`Attendance calculation: Present or late days: ${presentOrLateDays}, Rate: ${rate}%`);
  
  return rate;
}
