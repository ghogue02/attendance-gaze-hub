
import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileImageProps {
  userName?: string;
  className?: string;
  userId?: string;
}

const UserProfileImage = ({ userName = 'Greg Hogue', className = '', userId }: UserProfileImageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
    const fetchUserImage = async () => {
      try {
        // First try to fetch by user ID if provided
        if (userId) {
          const { data, error } = await supabase
            .from('students')
            .select('image_url')
            .eq('id', userId)
            .single();
            
          if (error) {
            console.error('Error fetching user by ID:', error);
          } else if (data?.image_url) {
            setImageUrl(data.image_url);
            return;
          }
        }
        
        // Fallback to fetching by name if no userId or no image found by userId
        const names = userName.split(' ');
        if (names.length >= 2) {
          const { data, error } = await supabase
            .from('students')
            .select('image_url')
            .eq('first_name', names[0])
            .eq('last_name', names[1])
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching user by name:', error);
          } else if (data?.image_url) {
            setImageUrl(data.image_url);
            return;
          }
        }
        
        // If we still don't have an image URL, throw an error to trigger fallback
        throw new Error('No image found');
      } catch (error) {
        console.error('Error fetching user image:', error);
        setImageError(true);
      }
    };
    
    fetchUserImage();
  }, [userName, userId]);

  return (
    <Avatar className={`border-2 border-white/20 ${className}`}>
      {imageUrl && !imageError && (
        <AvatarImage 
          src={imageUrl}
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
