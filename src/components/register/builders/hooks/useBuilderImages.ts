
import { useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCachedStudentImage, cacheStudentImage } from '@/utils/cache/studentImageCache';

export const useBuilderImages = (filteredBuilders: Builder[]) => {
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

  return {
    builderImages,
    imageLoadErrors,
    handleImageError
  };
};

export default useBuilderImages;
