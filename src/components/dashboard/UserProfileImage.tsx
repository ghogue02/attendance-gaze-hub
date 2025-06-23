
import { useState, useEffect, useRef, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { throttledRequest } from '@/utils/request/throttle';
import { getCachedStudentImage, cacheStudentImage, resetStudentImageErrorState } from '@/utils/cache/studentImageCache';
import { trackRequest } from '@/utils/debugging/requestTracker';

// Global shared memory cache for the current session with longer TTL
const imageCache = new Map<string, {url: string, timestamp: number}>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minute cache
const DEBUG_LOGGING = false; // Set to false to reduce console noise

// Global state to track which profile images are being fetched
const pendingFetches = new Set<string>();

interface UserProfileImageProps {
  userId: string;
  userName: string;
  className?: string;
}

export const UserProfileImage = memo(({ userId, userName, className = '' }: UserProfileImageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const hasAttemptedFetchRef = useRef(false);

  useEffect(() => {
    // Skip if we don't have a userId
    if (!userId) return;
    
    // Set up cleanup for when component unmounts
    isMountedRef.current = true;
    
    const fetchImage = async () => {
      // Prevent duplicate fetches within the same component lifecycle
      if (hasAttemptedFetchRef.current) return;
      hasAttemptedFetchRef.current = true;
      
      try {
        // Enhanced logging for problematic users
        const isProblematicUser = userName.includes('Mahkeddah') || userName.includes('Cherice');
        if (isProblematicUser) {
          console.log(`[UserProfileImage] DEBUGGING: Fetching image for ${userName} (ID: ${userId})`);
        }
        
        // First check our global shared memory cache (fastest)
        const cached = imageCache.get(userId);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
          if (isMountedRef.current) {
            setImageUrl(cached.url);
            if (isProblematicUser) {
              console.log(`[UserProfileImage] DEBUGGING: Using memory cache for ${userName}: ${cached.url}`);
            }
          }
          return;
        }

        // Then check the persisted cache in local storage
        const persistedImage = getCachedStudentImage(userId);
        if (persistedImage) {
          // Update our in-memory cache and state
          if (isMountedRef.current) {
            setImageUrl(persistedImage);
            if (isProblematicUser) {
              console.log(`[UserProfileImage] DEBUGGING: Using persisted cache for ${userName}: ${persistedImage}`);
            }
          }
          imageCache.set(userId, {url: persistedImage, timestamp: Date.now()});
          return;
        }
        
        // Prevent duplicate fetches for the same user ID across components
        if (pendingFetches.has(userId)) {
          if (isProblematicUser) {
            console.log(`[UserProfileImage] DEBUGGING: Fetch already pending for ${userName} (${userId})`);
          }
          return;
        }
        
        pendingFetches.add(userId);
        
        // Use throttled request to avoid duplicate fetches
        const data = await throttledRequest(
          `profile_${userId}`,
          async () => {
            // Only log when actually fetching from database
            if (DEBUG_LOGGING || isProblematicUser) {
              trackRequest('UserProfileImage', `fetch-${userId}`);
              console.log(`[UserProfileImage] DEBUGGING: Database fetch for user: ${userName} (ID: ${userId})`);
            }
            
            // Fetch from database with enhanced validation
            const { data, error } = await supabase
              .from('students')
              .select('id, image_url, first_name, last_name')
              .eq('id', userId)
              .single();
              
            if (error) {
              console.error(`[UserProfileImage] Database error for ${userName} (${userId}):`, error);
              throw error;
            }
            
            // Validate that we got the right student
            const dbName = `${data.first_name} ${data.last_name}`;
            if (dbName !== userName && isProblematicUser) {
              console.warn(`[UserProfileImage] NAME MISMATCH! Expected: ${userName}, DB returned: ${dbName} for ID: ${userId}`);
            }
            
            if (data?.image_url) {
              // Store in both caches for future use
              imageCache.set(userId, {url: data.image_url, timestamp: Date.now()});
              cacheStudentImage(userId, data.image_url);
              
              if (isProblematicUser) {
                console.log(`[UserProfileImage] DEBUGGING: Cached new image for ${userName}: ${data.image_url}`);
              }
            }
            
            return data;
          },
          300000 // 5 minute cache for throttled requests
        );
        
        if (data?.image_url && isMountedRef.current) {
          setImageUrl(data.image_url);
          if (isProblematicUser) {
            console.log(`[UserProfileImage] DEBUGGING: Set image URL for ${userName}: ${data.image_url}`);
          }
        }
      } catch (error) {
        console.error(`[UserProfileImage] Error fetching profile image for ${userName} (${userId}):`, error);
        // Reset error state for problematic users to allow retry
        if (userName.includes('Mahkeddah') || userName.includes('Cherice')) {
          resetStudentImageErrorState(userId);
        }
      } finally {
        // Always remove from pending fetches, even on error
        pendingFetches.delete(userId);
      }
    };
    
    fetchImage();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [userId, userName]);

  // Fallback to first letter of name when no image
  const fallbackInitial = userName ? userName.charAt(0).toUpperCase() : '?';

  return (
    <Avatar className={className}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={userName} 
          className="object-cover w-full h-full"
          onError={() => {
            console.warn(`[UserProfileImage] Image load failed for ${userName} (${userId}): ${imageUrl}`);
            setImageUrl(null); // Clear the failed image to show fallback
          }}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-primary text-primary-foreground">
          {fallbackInitial}
        </div>
      )}
    </Avatar>
  );
});

UserProfileImage.displayName = 'UserProfileImage';

export default UserProfileImage;
