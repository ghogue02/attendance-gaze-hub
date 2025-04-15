import { useState, useEffect } from 'react';
import { Check, AlertCircle, Clock } from 'lucide-react';
import { Builder } from '@/components/builder/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCachedData, setCachedData } from '@/utils/attendance/cacheManager';
import { 
  getCachedStudentImage, 
  cacheStudentImage 
} from '@/utils/cache/studentImageCache';

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

  // Fetch builder images when the component mounts or when filteredBuilders changes
  useEffect(() => {
    const fetchBuilderImages = async () => {
      // Skip fetching if no builders to display
      if (filteredBuilders.length === 0) return;
      
      const images: {[key: string]: string} = {};
      const errors: {[key: string]: boolean} = {};
      
      // Track which builders need image fetching
      const buildersToFetch: Builder[] = [];
      
      // First check shared global cache for each builder
      filteredBuilders.forEach(builder => {
        const cachedImage = getCachedStudentImage(builder.id);
        if (cachedImage) {
          images[builder.id] = cachedImage;
        } else {
          buildersToFetch.push(builder);
        }
      });
      
      // Only query database for builders without cached images
      if (buildersToFetch.length > 0) {
        try {
          // Batch query all needed builders in one request
          const { data, error } = await supabase
            .from('students')
            .select('id, image_url')
            .in('id', buildersToFetch.map(b => b.id));
            
          if (error) {
            console.error('Error fetching student images:', error);
            buildersToFetch.forEach(b => {
              errors[b.id] = true;
            });
          } else if (data) {
            // Process query results and cache them
            data.forEach(student => {
              if (student.image_url) {
                images[student.id] = student.image_url;
                cacheStudentImage(student.id, student.image_url);
              }
            });
            
            // Try to get images from face_registrations for builders still missing images
            const missingImageIds = buildersToFetch
              .filter(b => !images[b.id])
              .map(b => b.id);
              
            if (missingImageIds.length > 0) {
              const { data: faceData } = await supabase
                .from('face_registrations')
                .select('student_id, face_data')
                .in('student_id', missingImageIds)
                .order('created_at', { ascending: false });
                
              // Group by student_id and take the most recent entry
              const faceDataByStudent = faceData?.reduce((acc, item) => {
                if (!acc[item.student_id]) {
                  acc[item.student_id] = item.face_data;
                }
                return acc;
              }, {} as Record<string, string>) || {};
              
              // Add face registration data to images
              Object.entries(faceDataByStudent).forEach(([id, faceData]) => {
                images[id] = faceData;
                cacheStudentImage(id, faceData);
              });
            }
          }
        } catch (error) {
          console.error('Error in batch image fetching:', error);
          toast.error('Failed to load some builder images');
        }
      }
      
      setBuilderImages(images);
      setImageLoadErrors(errors);
    };

    // Use a debounce to avoid rapid re-fetching when filteredBuilders changes quickly
    const debounceTimeout = setTimeout(fetchBuilderImages, 300);
    
    return () => clearTimeout(debounceTimeout);
  }, [filteredBuilders]);

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
