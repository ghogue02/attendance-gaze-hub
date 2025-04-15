
import { Button } from '@/components/ui/button';
import { Check, Clock } from 'lucide-react';
import { Builder } from '@/components/builder/types';
import BuilderAvatar from './BuilderAvatar';

interface BuilderCardProps {
  builder: Builder;
  imageUrl?: string;
  hasImageLoadError: boolean;
  registrationStatus: {completed: boolean, count: number};
  onImageError: (builderId: string) => void;
  onStartRegistration: (builder: Builder) => void;
}

export const BuilderCard = ({
  builder,
  imageUrl,
  hasImageLoadError,
  registrationStatus,
  onImageError,
  onStartRegistration
}: BuilderCardProps) => {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-4 mb-4">
        <BuilderAvatar 
          builderId={builder.id}
          builderName={builder.name}
          imageUrl={imageUrl}
          hasLoadError={hasImageLoadError}
          onImageError={onImageError}
        />
        <div>
          <h3 className="text-lg font-semibold">{builder.name}</h3>
          <p className="text-sm text-muted-foreground">ID: {builder.builderId}</p>
        </div>
      </div>
      
      <div className="mt-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Registration Status:</span>
          <RegistrationStatusBadge status={registrationStatus} />
        </div>
        
        <Button
          onClick={() => onStartRegistration(builder)}
          variant={registrationStatus.completed ? "outline" : "default"}
          className="w-full mt-2"
        >
          {registrationStatus.completed ? "Update Face Data" : "Register Face"}
        </Button>
      </div>
    </div>
  );
};

const RegistrationStatusBadge = ({ status }: { status: {completed: boolean, count: number} }) => {
  if (status.completed) {
    return (
      <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
        <Check size={14} className="mr-1" />
        Complete
      </span>
    );
  } else if (status.count > 0) {
    return (
      <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
        {status.count}/5 Angles
      </span>
    );
  } else {
    return (
      <span className="text-sm bg-yellow-50 text-yellow-600 px-2 py-1 rounded-full flex items-center">
        <Clock size={14} className="mr-1" />
        Pending
      </span>
    );
  }
};

export default BuilderCard;
