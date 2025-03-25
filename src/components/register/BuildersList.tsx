import { useState, useEffect } from 'react';
import { Check, AlertCircle, Clock } from 'lucide-react';
import { Builder } from '@/components/BuilderCard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BuildersListProps {
  builders: Builder[];
  filteredBuilders: Builder[];
  searchQuery: string;
  loading: boolean;
  registrationStatus: {[key: string]: {completed: boolean, count: number}};
  onStartRegistration: (builder: Builder) => void;
  onClearSearch: () => void;
}

export const BuildersList = ({
  builders,
  filteredBuilders,
  searchQuery,
  loading,
  registrationStatus,
  onStartRegistration,
  onClearSearch
}: BuildersListProps) => {
  const [builderImages, setBuilderImages] = useState<{[key: string]: string}>({});
  const [imageLoadErrors, setImageLoadErrors] = useState<{[key: string]: boolean}>({});

  // Fetch up-to-date builder images when the component mounts or when registrationStatus changes
  useEffect(() => {
    const fetchBuilderImages = async () => {
      const images: {[key: string]: string} = {};
      const errors: {[key: string]: boolean} = {};
      
      for (const builder of filteredBuilders) {
        try {
          // Get the most recent image from the students table
          const { data, error } = await supabase
            .from('students')
            .select('image_url')
            .eq('id', builder.id)
            .maybeSingle();
            
          if (!error && data?.image_url) {
            images[builder.id] = data.image_url;
          } else if (error) {
            console.error('Error fetching student image:', error);
            errors[builder.id] = true;
            
            // Fallback: try to get image from face_registrations if not in students table
            const { data: faceData, error: faceError } = await supabase
              .from('face_registrations')
              .select('face_data')
              .eq('student_id', builder.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
              
            if (!faceError && faceData?.face_data) {
              images[builder.id] = faceData.face_data;
              errors[builder.id] = false;
            }
          }
        } catch (error) {
          console.error('Error fetching builder image:', error);
          errors[builder.id] = true;
        }
      }
      setBuilderImages(images);
      setImageLoadErrors(errors);
    };

    fetchBuilderImages();
  }, [filteredBuilders, registrationStatus]);

  const handleImageError = (builderId: string) => {
    console.error('Failed to load image for builder:', builderId);
    setImageLoadErrors(prev => ({...prev, [builderId]: true}));
    
    // Only show toast for the first few errors to avoid spamming
    if (Object.values(imageLoadErrors).filter(Boolean).length < 3) {
      toast.error('Could not load profile image');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading builders...</p>
      </div>
    );
  }
  
  if (filteredBuilders.length === 0) {
    return (
      <div className="text-center py-10 glass-card">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-lg font-medium">No builders found</p>
        <p className="text-sm text-muted-foreground">No results match your search criteria.</p>
        {searchQuery && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={onClearSearch}
          >
            Clear Search
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {filteredBuilders.map(builder => (
        <div key={builder.id} className="glass-card p-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 border-2 border-white/20">
              {builderImages[builder.id] && !imageLoadErrors[builder.id] ? (
                <AvatarImage 
                  src={builderImages[builder.id]} 
                  alt={builder.name} 
                  className="object-cover"
                  onError={() => handleImageError(builder.id)}
                />
              ) : (
                <AvatarFallback className="text-lg">
                  {builder.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{builder.name}</h3>
              <p className="text-sm text-muted-foreground">ID: {builder.builderId}</p>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Registration Status:</span>
              {registrationStatus[builder.id]?.completed ? (
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
                  <Check size={14} className="mr-1" />
                  Complete
                </span>
              ) : registrationStatus[builder.id]?.count > 0 ? (
                <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  {registrationStatus[builder.id]?.count}/5 Angles
                </span>
              ) : (
                <span className="text-sm bg-yellow-50 text-yellow-600 px-2 py-1 rounded-full flex items-center">
                  <Clock size={14} className="mr-1" />
                  Pending
                </span>
              )}
            </div>
            
            <Button
              onClick={() => onStartRegistration(builder)}
              variant={registrationStatus[builder.id]?.completed ? "outline" : "default"}
              className="w-full mt-2"
            >
              {registrationStatus[builder.id]?.completed ? "Update Face Data" : "Register Face"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
