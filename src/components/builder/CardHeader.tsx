
import UserProfileImage from '@/components/dashboard/UserProfileImage';
import { Builder, AttendanceStats } from './types';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AttendanceBadge from './AttendanceBadge';

interface CardHeaderProps {
  builder: Builder;
  attendanceStats: AttendanceStats | null; // Accept full stats object instead of just rate
  onNotesClick: (e: React.MouseEvent) => void;
}

const CardHeader = ({ builder, attendanceStats, onNotesClick }: CardHeaderProps) => {
  const getAttendanceRateColor = (rate: number | null | undefined) => {
    if (rate === null || rate === undefined) return "text-muted-foreground";
    if (rate === 100) return "text-green-700 font-bold";
    if (rate >= 94) return "text-green-600";
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getCohortBadgeVariant = (cohort?: string) => {
    if (cohort === 'March 2025 Pilot') return 'default';
    if (cohort === 'June 2025') return 'secondary';
    return 'outline';
  };

  const getCohortDisplayName = (cohort?: string) => {
    if (cohort === 'March 2025 Pilot') return 'Pilot';
    if (cohort === 'June 2025') return 'June';
    return cohort || 'Unknown';
  };

  // Extract values from the stats object
  const rate = attendanceStats?.rate;
  const presentCount = attendanceStats?.presentCount;
  const totalClassDays = attendanceStats?.totalClassDays;
  const isLoading = attendanceStats === null;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
      <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 shadow-sm border-2 border-white/20">
        <UserProfileImage
          userName={builder.name}
          userId={builder.id}
          className="w-full h-full"
        />
        <AttendanceBadge attendanceRate={rate} />
      </div>
      
      <div className="flex-1 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{builder.name}</h3>
              <Badge variant={getCohortBadgeVariant(builder.cohort)} className="text-xs">
                {getCohortDisplayName(builder.cohort)}
              </Badge>
            </div>
            <p className="text-sm text-foreground/70 mb-2">ID: {builder.builderId}</p>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-xs bg-muted/40 px-2 py-1 rounded-full min-w-[100px] justify-center">
              <CalendarIcon className="h-3 w-3" />
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  <span>Loading...</span>
                </>
              ) : totalClassDays && totalClassDays > 0 ? (
                <>
                  <span>Attendance:</span>
                  <span className={`font-bold ${getAttendanceRateColor(rate)}`}>
                    {rate}%
                  </span>
                  <span className="text-muted-foreground/80 ml-1">({presentCount}/{totalClassDays})</span>
                </>
              ) : (
                <span className="text-muted-foreground/80">No classes yet</span>
              )}
            </div>
            
            <button 
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={onNotesClick}
            >
              {builder.notes ? 'Edit Notes' : 'Add Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardHeader;
