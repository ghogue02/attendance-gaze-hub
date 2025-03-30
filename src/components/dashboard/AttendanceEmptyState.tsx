
import { FileX } from 'lucide-react';

interface AttendanceEmptyStateProps {
  dateFiltered?: boolean;
}

const AttendanceEmptyState = ({ dateFiltered = false }: AttendanceEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-md">
      <FileX className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No attendance records found</h3>
      <p className="text-muted-foreground max-w-md">
        {dateFiltered 
          ? 'There are no attendance records for the selected date. Try selecting a different date or clear the filter.'
          : 'No attendance records have been created yet. Records will appear here after builders have been marked present, late, or absent.'}
      </p>
    </div>
  );
};

export default AttendanceEmptyState;
