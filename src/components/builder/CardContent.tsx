
import { Builder } from './types';
import BuilderStatusIndicator from './BuilderStatusIndicator';

interface CardContentProps {
  builder: Builder;
}

const CardContent = ({ builder }: CardContentProps) => {
  return (
    <div className="mt-2">
      <BuilderStatusIndicator 
        status={builder.status}
        timeRecorded={builder.timeRecorded}
        excuseReason={builder.excuseReason}
      />
      
      {builder.notes && (
        <div className="mt-2 text-sm bg-muted/30 p-2 rounded-md truncate max-w-[400px]" title={builder.notes}>
          <span className="font-medium">Notes:</span> {builder.notes}
        </div>
      )}
    </div>
  );
};

export default CardContent;
