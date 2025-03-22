
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
  const [isLoading, setIsLoading] = useState(true);
  
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
      setIsLoading(true);
      setImageError(false);
      
      try {
        console.log(`Fetching image for user: ${userName} (ID: ${userId})`);
        
        // First try to get the image by userId
        if (userId) {
          const { data, error } = await supabase
            .from('face_registrations')
            .select('face_data')
            .eq('student_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (error) {
            console.error(`Error fetching face data for userId ${userId}:`, error);
          } else if (data?.face_data) {
            console.log(`Found face data by ID ${userId}`);
            setImageUrl(data.face_data);
            setIsLoading(false);
            return;
          } else {
            console.log(`No face data found for ID ${userId}, checking other methods`);
          }
        }
        
        // Fallback: For Greg Hogue, use the specific ID
        if (userName === 'Greg Hogue') {
          const gregId = '28bc877a-ba4a-4f73-bf58-90380a299b97';
          console.log('Using hardcoded ID for Greg Hogue:', gregId);
          
          const { data, error } = await supabase
            .from('face_registrations')
            .select('face_data')
            .eq('student_id', gregId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (error) {
            console.error('Error fetching face registration for Greg:', error);
          } else if (data?.face_data) {
            console.log('Found face data for Greg');
            setImageUrl(data.face_data);
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to local image for Greg Hogue
        if (userName?.toLowerCase() === 'greg hogue') {
          console.log('Using local image fallback for Greg Hogue');
          setImageUrl('/greg-hogue.jpg');
          setIsLoading(false);
          return;
        }
      
        // If all else fails, use the image from the builder object or show fallback
        if (imageUrl) {
          setIsLoading(false);
        } else {
          setImageError(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user image:', error);
        setImageError(true);
        setIsLoading(false);
      }
    };
    
    fetchUserImage();
  }, [userName, userId, imageUrl]);

  return (
    <Avatar className={`border-2 border-white/20 ${className}`}>
      {!imageError && imageUrl && (
        <AvatarImage 
          src={imageUrl}
          alt={userName}
          onError={() => {
            console.error('Error loading image from URL:', imageUrl?.substring(0, 50) + '...');
            setImageError(true);
          }}
        />
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
