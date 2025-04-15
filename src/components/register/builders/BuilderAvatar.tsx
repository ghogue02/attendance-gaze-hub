
import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { isStudentImageInErrorCooldown, resetStudentImageErrorState, getCachedStudentImage } from '@/utils/cache/studentImageCache';

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
  const [cachedImage, setCachedImage] = useState<string | null>(null);
  
  // Check cache and handle image URL changes
  useEffect(() => {
    // First check if there's a valid imageUrl prop
    if (imageUrl) {
      setCachedImage(imageUrl);
      setIsRetrying(false);
      return;
    }
    
    // If no imageUrl is provided, try to get from cache
    const cached = getCachedStudentImage(builderId);
    if (cached) {
      setCachedImage(cached);
    }
  }, [imageUrl, builderId]);
  
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
  const shouldShowImage = (imageUrl || cachedImage) && !inErrorCooldown;
  
  return (
    <Avatar className="h-16 w-16 border-2 border-white/20">
      {shouldShowImage ? (
        <AvatarImage 
          src={imageUrl || cachedImage || ''} 
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
