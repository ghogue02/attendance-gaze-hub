
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Builder, BuilderStatus } from '@/components/BuilderCard';
import { format } from 'date-fns';

interface AttendanceHistoryProps {
  builders: Builder[];
}

// Helper function to get status color
const getStatusColor = (status: BuilderStatus) => {
  switch (status) {
    case 'present':
      return 'text-green-600';
    case 'absent':
      return 'text-red-600';
    case 'excused':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
};

const AttendanceHistory = ({ builders }: AttendanceHistoryProps) => {
  // Sort builders by name
  const sortedBuilders = [...builders].sort((a, b) => a.name.localeCompare(b.name));
  
  return (
    <div className="glass-card p-6 overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">Attendance History</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Builder ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBuilders.map((builder) => (
              <TableRow key={builder.id}>
                <TableCell className="font-medium">{builder.name}</TableCell>
                <TableCell>{builder.builderId}</TableCell>
                <TableCell>
                  <span className={`font-medium capitalize ${getStatusColor(builder.status)}`}>
                    {builder.status}
                  </span>
                </TableCell>
                <TableCell>{builder.timeRecorded || '—'}</TableCell>
                <TableCell>{builder.excuseReason || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AttendanceHistory;
