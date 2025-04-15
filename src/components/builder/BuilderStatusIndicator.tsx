
import { getStatusColor, getStatusIcon, formatISOToEasternTime } from './BuilderCardUtils';
import { BuilderStatus } from './types';

interface BuilderStatusIndicatorProps {
  status: BuilderStatus;
  timeRecorded?: string;
  excuseReason?: string;
  timeRecordedISO?: string; // Added support for ISO string directly
}

const BuilderStatusIndicator = ({ 
  status, 
  timeRecorded, 
  excuseReason,
  timeRecordedISO
}: BuilderStatusIndicatorProps) => {
  // If we have an ISO string, format it to Eastern Time
  const displayTime = timeRecordedISO ? formatISOToEasternTime(timeRecordedISO) : timeRecorded;

  return (
    <div>
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status === 'excused' ? 'Excused Absence' : status}</span>
      </div>
      
      {displayTime && (
        <p className="text-xs text-foreground/60 mt-2">
          {status === 'present' ? 'Recorded at: ' : 'Last check: '}
          {displayTime} (ET)
        </p>
      )}
      
      {excuseReason && status === 'excused' && (
        <p className="text-xs italic text-foreground/60 mt-1">
          Reason: {excuseReason}
        </p>
      )}
    </div>
  );
};

export default BuilderStatusIndicator;
