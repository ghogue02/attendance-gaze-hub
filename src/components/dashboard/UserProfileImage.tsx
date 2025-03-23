
import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
        
        // First try to get the image from the students table
        if (userId) {
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('image_url')
            .eq('id', userId)
            .maybeSingle();
            
          console.log("Student data from database:", studentData);
            
          if (!studentError && studentData?.image_url) {
            console.log(`Found image in students table for ID ${userId}`);
            setImageUrl(studentData.image_url);
            setIsLoading(false);
            return;
          }
        }
        
        // If that fails, try face_registrations table
        if (userId) {
          const { data, error } = await supabase
            .from('face_registrations')
            .select('face_data')
            .eq('student_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          console.log("Face registration data:", data);
            
          if (!error && data?.face_data) {
            console.log(`Found face data by ID ${userId}`);
            setImageUrl(data.face_data);
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback: For Greg Hogue, use the specific ID
        if (userName === 'Greg Hogue') {
          const gregId = '28bc877a-ba4a-4f73-bf58-90380a299b97';
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
      
        // If all else fails, show fallback
        setImageError(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user image:', error);
        setImageError(true);
        setIsLoading(false);
      }
    };
    
    fetchUserImage();
  }, [userName, userId]);

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
