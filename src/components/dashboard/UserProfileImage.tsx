
import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getCachedData, setCachedData } from '@/utils/attendance/cacheManager';

interface UserProfileImageProps {
  userName?: string;
  className?: string;
  userId?: string;
}

// In-memory cache for images to prevent excessive database calls
const imageCache = new Map<string, string>();

const UserProfileImage = ({ userName = 'Greg Hogue', className = '', userId }: UserProfileImageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get initials from name
  const getInitials = () => {
    if (!userName) return 'U';
    return userName.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  // Create a function to fetch the image that can be reused
  const fetchUserImage = async () => {
    setIsLoading(true);
    setImageError(false);
    
    try {
      // Check local memory cache first (fastest)
      if (userId && imageCache.has(userId)) {
        setImageUrl(imageCache.get(userId) || null);
        setIsLoading(false);
        return;
      }
      
      // Then check persistent cache
      const cacheKey = `profile_image_${userId || userName}`;
      const cachedImage = getCachedData<string>(cacheKey, 30 * 60 * 1000); // 30 minutes
      
      if (cachedImage) {
        setImageUrl(cachedImage);
        // Also update memory cache
        if (userId) imageCache.set(userId, cachedImage);
        setIsLoading(false);
        return;
      }
      
      console.log(`UserProfileImage: Fetching image for user: ${userName} (ID: ${userId})`);
      
      // If no cache hit, try to get from database
      if (userId) {
        // First try to get the image from the students table
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('image_url')
          .eq('id', userId)
          .maybeSingle();
          
        console.log("Student data from database:", studentData);
        console.log("Image URL exists:", !!studentData?.image_url);
          
        if (!studentError && studentData?.image_url) {
          console.log(`Found image in students table for ID ${userId}`);
          setImageUrl(studentData.image_url);
          
          // Update caches
          imageCache.set(userId, studentData.image_url);
          setCachedData(cacheKey, studentData.image_url);
          
          setIsLoading(false);
          return;
        }
        
        // If that fails, try face_registrations table as fallback
        if (!studentData?.image_url) {
          const { data, error } = await supabase
            .from('face_registrations')
            .select('face_data')
            .eq('student_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          console.log("Face registration data:", data);
          console.log("Face data exists:", !!data?.face_data);
            
          if (!error && data?.face_data) {
            console.log(`Found face data by ID ${userId}`);
            // Check if the face_data is a URL or base64
            if (data.face_data.startsWith('http')) {
              setImageUrl(data.face_data);
              imageCache.set(userId, data.face_data);
              setCachedData(cacheKey, data.face_data);
            } else {
              setImageUrl(data.face_data);
              imageCache.set(userId, data.face_data);
              setCachedData(cacheKey, data.face_data);
            }
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Fallback: For Greg Hogue, use the specific ID
      if (userName === 'Greg Hogue') {
        const gregId = '28bc877a-ba4a-4f73-bf58-90380a299b97';
        
        // Get from cache first
        const gregCacheKey = `profile_image_${gregId}`;
        const cachedGregImage = getCachedData<string>(gregCacheKey);
        
        if (cachedGregImage) {
          setImageUrl(cachedGregImage);
          setIsLoading(false);
          return;
        }
        
        console.log('Using hardcoded ID for Greg Hogue:', gregId);
        
        // First check students table
        const { data: gregStudent, error: gregStudentError } = await supabase
          .from('students')
          .select('image_url')
          .eq('id', gregId)
          .maybeSingle();
          
        if (!gregStudentError && gregStudent?.image_url) {
          console.log('Found image for Greg in students table');
          setImageUrl(gregStudent.image_url);
          setCachedData(gregCacheKey, gregStudent.image_url);
          setIsLoading(false);
          return;
        }
        
        // Then check face_registrations
        const { data, error } = await supabase
          .from('face_registrations')
          .select('face_data')
          .eq('student_id', gregId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (!error && data?.face_data) {
          console.log('Found face data for Greg');
          // Check if the face_data is a URL or base64
          if (data.face_data.startsWith('http')) {
            setImageUrl(data.face_data);
            setCachedData(gregCacheKey, data.face_data);
          } else {
            setImageUrl(data.face_data);
            setCachedData(gregCacheKey, data.face_data);
          }
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback to local image for Greg Hogue
      if (userName?.toLowerCase().includes('greg')) {
        console.log('Using local image fallback for Greg Hogue');
        setImageUrl('/greg-hogue.jpg');
        setIsLoading(false);
        return;
      }
    
      // If all else fails, show fallback
      setImageError(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user image:', error);
      setImageError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Deduplicate API calls with debounce
    const cacheKey = `profile_image_request_${userId || userName}`;
    const recentRequest = getCachedData<boolean>(cacheKey, 1000); // 1 second debounce
    
    if (!recentRequest) {
      setCachedData(cacheKey, true, 1000);
      fetchUserImage();
    }
    
    // Set up a realtime subscription to detect profile updates - 
    // but only if we haven't set one up recently
    const subscriptionKey = `profile_subscription_${userId || userName}`;
    const hasSubscription = getCachedData<boolean>(subscriptionKey, 60000); // 1 minute
    
    if (!hasSubscription && userId) {
      setCachedData(subscriptionKey, true, 60000);
      
      const studentsChannel = supabase
        .channel('profile-image-changes')
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'students', filter: userId ? `id=eq.${userId}` : undefined }, 
          (payload) => {
            console.log('Profile image change detected:', payload);
            
            // Clear caches and refetch
            if (userId) {
              imageCache.delete(userId);
              clearCachedData(`profile_image_${userId}`);
            }
            fetchUserImage();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(studentsChannel);
      };
    }
  }, [userName, userId]);
  
  // Helper function to clear image cache
  const clearCachedData = (key: string) => {
    setCachedData(key, null, 0); // Effectively clearing the cache
  };

  return (
    <Avatar className={`relative overflow-hidden ${className}`}>
      {!imageError && imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <AvatarImage 
            src={imageUrl}
            alt={userName}
            className="object-cover w-full h-full"
            onError={() => {
              console.error('Error loading image from URL:', imageUrl?.substring(0, 50) + '...');
              setImageError(true);
              toast({
                title: "Image Error",
                description: "Could not load profile image",
                variant: "destructive"
              });
            }}
          />
        </div>
      )}
      
      <AvatarFallback className="bg-primary/10 text-primary">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          imageError ? <User className="h-5 w-5" /> : getInitials()
        )}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserProfileImage;
