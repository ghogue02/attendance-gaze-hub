
import { getStatusColor, getStatusIcon } from './BuilderCardUtils';
import { BuilderStatus } from './types';

interface BuilderStatusIndicatorProps {
  status: BuilderStatus;
  timeRecorded?: string;
  excuseReason?: string;
}

const BuilderStatusIndicator = ({ 
  status, 
  timeRecorded, 
  excuseReason 
}: BuilderStatusIndicatorProps) => {
  return (
    <div>
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status === 'excused' ? 'Excused Absence' : status}</span>
      </div>
      
      {timeRecorded && (
        <p className="text-xs text-foreground/60 mt-2">
          {status === 'present' ? 'Recorded at: ' : 'Last check: '}
          {timeRecorded}
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
