
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';

interface AttendanceBadgeProps {
  attendanceRate: number | null;
}

const AttendanceBadge = ({ attendanceRate }: AttendanceBadgeProps) => {
  // Only show badge for users with perfect attendance
  if (attendanceRate !== 100) {
    return null;
  }

  return (
    <Badge 
      className="absolute -bottom-1 -right-1 px-1.5 py-1 bg-green-500 border-white border-2 flex items-center gap-1"
      variant="default"
    >
      <Award className="h-3 w-3 text-white" />
      <span className="text-[10px] font-bold">100%</span>
    </Badge>
  );
};

export default AttendanceBadge;
