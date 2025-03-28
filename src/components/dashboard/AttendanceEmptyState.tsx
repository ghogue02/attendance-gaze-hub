
import { memo } from 'react';

const AttendanceEmptyState = memo(() => {
  return (
    <div className="py-12 text-center">
      <p className="text-muted-foreground">No attendance records found.</p>
    </div>
  );
});

AttendanceEmptyState.displayName = 'AttendanceEmptyState';

export default AttendanceEmptyState;
