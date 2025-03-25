
import { parseAttendanceData, importHistoricalAttendance } from './importHistoricalData';

// The raw data is stored in attendanceData.ts
import { attendanceData } from './attendanceData';

// This function will run the import
export const runAttendanceImport = async () => {
  console.log('Starting historical attendance import...');
  
  // Parse the raw data
  const records = parseAttendanceData(attendanceData);
  console.log(`Parsed ${records.length} attendance records`);
  
  // Run the import
  const result = await importHistoricalAttendance(records);
  
  return result;
};
