
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
        console.log('Fetching image for:', userName, 'userId:', userId);
        
        // For debugging - log all students to see what's available
        const { data: allStudents, error: allStudentsError } = await supabase
          .from('students')
          .select('id, first_name, last_name, image_url');
          
        if (allStudentsError) {
          console.error('Error fetching all students:', allStudentsError);
        } else {
          console.log('Available students:', allStudents);
        }
        
        // First try to fetch by user ID if provided
        if (userId) {
          console.log('Trying to fetch by ID:', userId);
          const { data, error } = await supabase
            .from('students')
            .select('image_url')
            .eq('id', userId)
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching user by ID:', error);
          } else if (data?.image_url) {
            console.log('Found image by ID:', data.image_url);
            setImageUrl(data.image_url);
            setIsLoading(false);
            return;
          } else {
            console.log('No image found by ID');
          }
        }
        
        // Fallback to fetching by name if no userId or no image found by userId
        const names = userName.split(' ');
        if (names.length >= 2) {
          console.log('Trying to fetch by name:', names[0], names[1]);
          
          // Query by first_name and last_name
          const { data, error } = await supabase
            .from('students')
            .select('image_url')
            .ilike('first_name', names[0])
            .ilike('last_name', names[1])
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching user by name:', error);
          } else if (data?.image_url) {
            console.log('Found image by name:', data.image_url);
            setImageUrl(data.image_url);
            setIsLoading(false);
            return;
          } else {
            console.log('No image found by name');
          }
          
          // If exact match failed, try a more flexible search (partial/case-insensitive)
          console.log('Trying more flexible name search');
          const { data: flexData, error: flexError } = await supabase
            .from('students')
            .select('image_url')
            .or(`first_name.ilike.%${names[0]}%,last_name.ilike.%${names[1]}%`)
            .maybeSingle();
            
          if (flexError) {
            console.error('Error with flexible name search:', flexError);
          } else if (flexData?.image_url) {
            console.log('Found image by flexible name search:', flexData.image_url);
            setImageUrl(flexData.image_url);
            setIsLoading(false);
            return;
          }
        }
        
        // Try by just first name as a last resort
        if (names && names.length > 0) {
          console.log('Trying just first name:', names[0]);
          const { data, error } = await supabase
            .from('students')
            .select('image_url')
            .ilike('first_name', names[0])
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching by first name only:', error);
          } else if (data?.image_url) {
            console.log('Found image by first name only:', data.image_url);
            setImageUrl(data.image_url);
            setIsLoading(false);
            return;
          }
        }
        
        // If we still don't have an image URL, use a fallback
        console.log('No image found, using fallback');
        setImageError(true);
      } catch (error) {
        console.error('Error fetching user image:', error);
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserImage();
  }, [userName, userId]);

  // Directly use a fallback URL if we have the specific user
  const isGregHogue = userName?.toLowerCase() === 'greg hogue';
  const fallbackImageUrl = isGregHogue ? '/greg-hogue.jpg' : null;

  return (
    <Avatar className={`border-2 border-white/20 ${className}`}>
      {!imageError && imageUrl && (
        <AvatarImage 
          src={imageUrl}
          alt={userName}
          onError={() => {
            console.error('Error loading image from URL:', imageUrl);
            setImageError(true);
          }}
        />
      )}
      
      {!imageError && !imageUrl && fallbackImageUrl && (
        <AvatarImage 
          src={fallbackImageUrl}
          alt={userName}
          onError={() => {
            console.error('Error loading fallback image');
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
