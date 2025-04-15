import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { throttledRequest } from '@/utils/request/throttle';

// Keep a simple in-memory cache for the current session
const imageCache = new Map<string, string>();

interface UserProfileImageProps {
  userId: string;
  userName: string;
  className?: string;
}

export const UserProfileImage = ({ userId, userName, className = '' }: UserProfileImageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Skip if we don't have a userId
    if (!userId) return;
    
    const fetchImage = async () => {
      try {
        // Use throttled request to avoid duplicate fetches
        const data = await throttledRequest(
          `profile_${userId}`,
          async () => {
            console.log(`UserProfileImage: Fetching image for user: ${userName} (ID: ${userId})`);
            
            // Check in-memory cache first
            if (imageCache.has(userId)) {
              return { image_url: imageCache.get(userId) };
            }
            
            // Otherwise fetch from database
            const { data, error } = await supabase
              .from('students')
              .select('image_url')
              .eq('id', userId)
              .single();
              
            if (error) {
              throw error;
            }
            
            if (data?.image_url) {
              // Store in cache for future use
              imageCache.set(userId, data.image_url);
            }
            
            return data;
          },
          300000 // 5 minute cache
        );
        
        if (data?.image_url) {
          console.log('Image URL exists:', !!data.image_url);
          console.log(`Found image in students table for ID ${userId}`);
          setImageUrl(data.image_url);
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
      }
    };
    
    fetchImage();
  }, [userId, userName]);

  // Fallback to first letter of name when no image
  const fallbackInitial = userName ? userName.charAt(0).toUpperCase() : '?';

  return (
    <Avatar className={className}>
      {imageUrl ? (
        <img src={imageUrl} alt={userName} className="object-cover w-full h-full" />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-primary text-primary-foreground">
          {fallbackInitial}
        </div>
      )}
    </Avatar>
  );
};

export default UserProfileImage;
