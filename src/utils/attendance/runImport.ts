// Update import to use the correct exported member
import { clearAttendanceCache } from './attendanceData';
import { getAllBuilders } from './attendanceData';

async function runImport() {
  // Example: Clear cache for a specific date
  clearAttendanceCache('2024-01-01');

  // Example: Clear all attendance cache
  clearAttendanceCache();

  // Example: Fetch all builders for a specific date
  const builders = await getAllBuilders('2024-01-01');
  console.log('Builders:', builders);
}

runImport();
