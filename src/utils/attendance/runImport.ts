
import { clearAttendanceCache } from './attendanceData';
import { getAllBuilders } from './attendanceData';

export async function runAttendanceImport() {
  try {
    // Clear cache for current date
    clearAttendanceCache();

    // Fetch all builders for current date
    const builders = await getAllBuilders(new Date().toISOString().split('T')[0]);
    console.log('Imported builders:', builders);

    // Return true to indicate successful import
    return true;
  } catch (error) {
    console.error('Error during attendance import:', error);
    // Return false to indicate import failure
    return false;
  }
}
