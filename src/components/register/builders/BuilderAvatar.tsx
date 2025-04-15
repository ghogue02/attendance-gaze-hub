
import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface BuilderAvatarProps {
  builderId: string;
  builderName: string;
  imageUrl?: string;
  hasLoadError?: boolean;
  onImageError: (builderId: string) => void;
}

export const BuilderAvatar = ({
  builderId,
  builderName,
  imageUrl,
  hasLoadError,
  onImageError
}: BuilderAvatarProps) => {
  return (
    <Avatar className="h-16 w-16 border-2 border-white/20">
      {imageUrl && !hasLoadError ? (
        <AvatarImage 
          src={imageUrl} 
          alt={builderName} 
          className="object-cover"
          onError={() => onImageError(builderId)}
        />
      ) : (
        <AvatarFallback className="text-lg">
          {builderName.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default BuilderAvatar;
