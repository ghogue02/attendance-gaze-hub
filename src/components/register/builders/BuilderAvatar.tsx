
import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { isStudentImageInErrorCooldown, resetStudentImageErrorState } from '@/utils/cache/studentImageCache';

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
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Reset error state when image URL changes
  useEffect(() => {
    if (imageUrl) {
      setIsRetrying(false);
    }
  }, [imageUrl]);

  const handleImageError = () => {
    if (!isRetrying) {
      onImageError(builderId);
    }
  };

  // Generate initials for fallback
  const initials = builderName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const inErrorCooldown = hasLoadError || isStudentImageInErrorCooldown(builderId);
  const shouldShowImage = imageUrl && !inErrorCooldown;
  
  return (
    <Avatar className="h-16 w-16 border-2 border-white/20">
      {shouldShowImage ? (
        <AvatarImage 
          src={imageUrl} 
          alt={builderName} 
          className="object-cover"
          onError={handleImageError}
        />
      ) : (
        <AvatarFallback className="text-lg bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default BuilderAvatar;
