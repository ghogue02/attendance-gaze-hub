
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { BuilderStatus } from './types';
import BuilderStatusButtons from './BuilderStatusButtons';

interface CardActionsProps {
  currentStatus: BuilderStatus;
  onStatusChange?: (status: BuilderStatus) => void;
  onDeleteRequest?: () => void;
}

const CardActions = ({ currentStatus, onStatusChange, onDeleteRequest }: CardActionsProps) => {
  return (
    <div className="flex flex-col gap-2">
      {onStatusChange && (
        <BuilderStatusButtons 
          currentStatus={currentStatus}
          onStatusChange={onStatusChange}
        />
      )}
      
      {onDeleteRequest && (
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => onDeleteRequest()}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      )}
    </div>
  );
};

export default CardActions;
