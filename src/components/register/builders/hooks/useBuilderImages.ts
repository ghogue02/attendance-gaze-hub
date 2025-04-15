
import { useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  getCachedStudentImage, 
  cacheStudentImage, 
  getUncachedUserIds,
  getOptimalBatchSize,
  markStudentImageError,
  isStudentImageInErrorCooldown
} from '@/utils/cache/studentImageCache';

export const useBuilderImages = (filteredBuilders: Builder[]) => {
  const [builderImages, setBuilderImages] = useState<{[key: string]: string}>({});
  const [imageLoadErrors, setImageLoadErrors] = useState<{[key: string]: boolean}>({});
  const [isFetching, setIsFetching] = useState(false);

  // Fetch builder images when the component mounts or when filteredBuilders changes
  useEffect(() => {
    // Cleanup function to handle component unmounting
    let isMounted = true;
    
    const fetchBuilderImages = async () => {
      // Skip fetching if already in progress or no builders to display
      if (isFetching || filteredBuilders.length === 0) return;
      
      setIsFetching(true);
      
      // Start with images already in cache
      const images: {[key: string]: string} = {};
      const errors: {[key: string]: boolean} = {};
      
      // First check shared global cache for each builder
      filteredBuilders.forEach(builder => {
        const cachedImage = getCachedStudentImage(builder.id);
        if (cachedImage) {
          images[builder.id] = cachedImage;
        }
        
        // Mark errors for builders in error cooldown
        if (isStudentImageInErrorCooldown(builder.id)) {
          errors[builder.id] = true;
        }
      });
      
      // Find uncached builder IDs that need fetching
      const buildersToFetch = getUncachedUserIds(filteredBuilders.map(b => b.id));
      
      // Only proceed with database queries if there are uncached builders
      if (buildersToFetch.length > 0) {
        try {
          const batchSize = getOptimalBatchSize();
          
          // Process in batches to avoid overloading the database
          for (let i = 0; i < buildersToFetch.length; i += batchSize) {
            if (!isMounted) return; // Stop if component unmounted
            
            const batchIds = buildersToFetch.slice(i, i + batchSize);
            
            // Batch query students table
            const { data, error } = await supabase
              .from('students')
              .select('id, image_url')
              .in('id', batchIds);
              
            if (error) {
              console.error('Error fetching student images:', error);
              batchIds.forEach(id => {
                errors[id] = true;
                markStudentImageError(id);
              });
            } else if (data) {
              // Process query results and cache them
              data.forEach(student => {
                if (student.image_url) {
                  images[student.id] = student.image_url;
                  cacheStudentImage(student.id, student.image_url);
                }
              });
              
              // Check for missing images and try face_registrations as fallback
              const missingImageIds = batchIds.filter(id => !images[id]);
              
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
          }
        } catch (error) {
          console.error('Error in batch image fetching:', error);
          // Only show toast for significant errors, not every image
          if (buildersToFetch.length > 5) {
            toast.error('Failed to load some builder images');
          }
        }
      }
      
      if (isMounted) {
        setBuilderImages(images);
        setImageLoadErrors(errors);
        setIsFetching(false);
      }
    };

    // Use a debounce to avoid rapid re-fetching when filteredBuilders changes quickly
    const debounceTimeout = setTimeout(fetchBuilderImages, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(debounceTimeout);
      setIsFetching(false);
    };
  }, [filteredBuilders, isFetching]);

  const handleImageError = (builderId: string) => {
    console.error('Failed to load image for builder:', builderId);
    setImageLoadErrors(prev => ({...prev, [builderId]: true}));
    markStudentImageError(builderId);
    
    // Only show toast for the first few errors to avoid spamming
    if (Object.values(imageLoadErrors).filter(Boolean).length < 3) {
      toast.error('Could not load profile image');
    }
  };

  return {
    builderImages,
    imageLoadErrors,
    handleImageError,
    isFetching
  };
};

export default useBuilderImages;
