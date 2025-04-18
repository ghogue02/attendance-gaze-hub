
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';

interface AttendanceBadgeProps {
  attendanceRate: number | null;
}

// Global debug flag - set to false to reduce console noise
const DEBUG_LOGGING = false;

const AttendanceBadge = ({ attendanceRate }: AttendanceBadgeProps) => {
  // Only show badge for perfect attendance (exactly 100%)
  if (attendanceRate === null || attendanceRate !== 100) {
    return null;
  }

  // Debug output to verify the attendance rate being passed
  DEBUG_LOGGING && console.log(`[AttendanceBadge] Rendering badge with perfect attendance rate: ${attendanceRate}%`);

  return (
    <Badge 
      className="absolute -bottom-1 -right-1 px-1.5 py-1 bg-green-600 border-white border-2 flex items-center gap-1"
      variant="default"
    >
      <Award className="h-3 w-3 text-white" />
      <span className="text-[10px] font-bold">{attendanceRate}%</span>
    </Badge>
  );
};

export default AttendanceBadge;
