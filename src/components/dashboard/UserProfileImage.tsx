
import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface UserProfileImageProps {
  userName?: string;
  className?: string;
}

const UserProfileImage = ({ userName = 'Greg Hogue', className = '' }: UserProfileImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Get initials from name
  const getInitials = () => {
    if (!userName) return 'U';
    return userName.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    // Simulate fetching the user's profile image
    // In a real application, this would come from your user profile or authentication system
    const img = new Image();
    img.src = '/greg-hogue.jpg'; // Path to the uploaded image
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
  }, []);

  return (
    <Avatar className={`border-2 border-white/20 ${className}`}>
      {!imageError && (
        <AvatarImage 
          src="/greg-hogue.jpg" 
          alt={userName}
          onError={() => setImageError(true)}
        />
      )}
      <AvatarFallback className="bg-primary/10 text-primary">
        {imageError ? <User className="h-5 w-5" /> : getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserProfileImage;
