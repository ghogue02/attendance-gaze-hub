
// Export all attendance service functions from this central file

// Export from pendingAttendance.ts
export { 
  markPendingAsAbsent, 
  processPendingAttendance, 
  processAttendanceForDate,
  removeApril4thRecords
} from './pendingAttendance';

// Export from automatedNotes.ts
export { clearAutomatedNotesForPresentStudents } from './automatedNotes';

// Export from historicalDates.ts
export { processSpecificDateIssues } from './historicalDates';

// Export from stats.ts
export { fetchStats } from './stats';

// Export from realtime.ts
export { subscribeToAttendanceChanges } from './realtime';

// Export from attendanceHistoryService.ts
export { deleteAttendanceRecordsByDate } from '@/services/attendanceHistoryService';
