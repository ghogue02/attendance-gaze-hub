
import UserProfileImage from '@/components/dashboard/UserProfileImage';
import { Builder } from './types';
import { CalendarIcon } from 'lucide-react';
import AttendanceBadge from './AttendanceBadge';

interface CardHeaderProps {
  builder: Builder;
  attendanceRate: number | null;
  onNotesClick: (e: React.MouseEvent) => void;
}

const CardHeader = ({ builder, attendanceRate, onNotesClick }: CardHeaderProps) => {
  const getAttendanceRateColor = (rate: number) => {
    if (rate === 100) return "text-green-700 font-bold";
    if (rate >= 94) return "text-green-600";
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
      <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 shadow-sm border-2 border-white/20">
        <UserProfileImage
          userName={builder.name}
          userId={builder.id}
          className="w-full h-full"
        />
        <AttendanceBadge attendanceRate={attendanceRate} />
      </div>
      
      <div className="flex-1 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between">
          <div>
            <h3 className="font-semibold text-lg">{builder.name}</h3>
            <p className="text-sm text-foreground/70 mb-2">ID: {builder.builderId}</p>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {attendanceRate !== null && (
              <div className="flex items-center gap-1 text-xs bg-muted/40 px-2 py-1 rounded-full">
                <CalendarIcon className="h-3 w-3" />
                <span>Attendance:</span>
                <span className={`font-bold ${getAttendanceRateColor(attendanceRate)}`}>
                  {attendanceRate}%
                </span>
              </div>
            )}
            
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
