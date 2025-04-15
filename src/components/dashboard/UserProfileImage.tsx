
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { throttledRequest } from '@/utils/request/throttle';

// Enhanced in-memory cache for the current session with longer TTL
const imageCache = new Map<string, {url: string, timestamp: number}>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minute cache

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
        // Check in-memory cache first with TTL validation
        const cached = imageCache.get(userId);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
          setImageUrl(cached.url);
          return;
        }
        
        // Use throttled request to avoid duplicate fetches
        const data = await throttledRequest(
          `profile_${userId}`,
          async () => {
            // Only log when actually fetching from database
            console.log(`UserProfileImage: Fetching image for user: ${userName} (ID: ${userId})`);
            
            // Fetch from database
            const { data, error } = await supabase
              .from('students')
              .select('image_url')
              .eq('id', userId)
              .single();
              
            if (error) {
              throw error;
            }
            
            if (data?.image_url) {
              // Store in cache for future use with timestamp
              imageCache.set(userId, {url: data.image_url, timestamp: Date.now()});
            }
            
            return data;
          },
          300000 // 5 minute cache for throttled requests
        );
        
        if (data?.image_url) {
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
