
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  HeadshotData,
  getCachedHeadshots, 
  setCachedHeadshots, 
  isHeadshotCacheValid,
  fetchImageAsBase64 
} from '@/utils/headshots/headshotCache';

export const useHeadshots = () => {
  const [headshots, setHeadshots] = useState<HeadshotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeadshots = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check for cached data first with extended TTL
        if (isHeadshotCacheValid()) {
          const cachedData = getCachedHeadshots();
          console.log(`Using cached headshots data (${cachedData?.data.length} items)`);
          setHeadshots(cachedData?.data || []);
          setLoading(false);
          return;
        }
        
        console.log('No valid cache found or cache expired, fetching headshots from storage...');
        
        // List all files in the headshots bucket once
        const { data: files, error: listError } = await supabase
          .storage
          .from('headshots')
          .list('', {
            limit: 200,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
          });
          
        if (listError) {
          console.error('Error listing headshots bucket:', listError);
          setError(`Error listing files: ${listError.message}`);
          toast.error(`Error loading headshots: ${listError.message}`);
          setLoading(false);
          return;
        }
        
        if (!files || files.length === 0) {
          console.log('No files found in the headshots bucket.');
          setError('No headshots found in the storage bucket');
          setLoading(false);
          return;
        }
        
        console.log(`Found ${files.length} raw entries in headshots bucket`);
        
        // Filter for image files
        const imageFiles = files.filter(file => 
          file.name.toLowerCase().match(/\.(jpeg|jpg|png|webp|gif|bmp)$/i) && file.id !== null
        );
        
        if (imageFiles.length === 0) {
          console.error('No image files found after filtering.');
          setError('No image files found in the headshots bucket');
          toast.error('No image files found in the headshots bucket');
          setLoading(false);
          return;
        }
        
        console.log(`Found ${imageFiles.length} image files after filtering.`);
        
        // Base URL for headshots bucket
        const baseUrl = 'https://emswwbojtxipisaqfmrk.supabase.co/storage/v1/object/public/headshots/';
        
        // Process headshots 
        const processedHeadshots: HeadshotData[] = imageFiles.map(file => {
          // Extract builder name from filename (removing extension)
          const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          
          // Construct URL with proper encoding for spaces and special characters
          const encodedFileName = encodeURIComponent(file.name);
          const url = `${baseUrl}${encodedFileName}`;
          
          return { name, url };
        });
        
        if (processedHeadshots.length === 0) {
          console.error('Failed to process any headshot images or get URLs.');
          setError('Failed to process headshot images');
          toast.error('Failed to process headshot images');
          setLoading(false);
          return;
        }
        
        // Shuffle the headshots array for random order
        const shuffledHeadshots = [...processedHeadshots].sort(() => Math.random() - 0.5);
        console.log(`Prepared ${shuffledHeadshots.length} headshots for carousel`);
        
        // Fetch all images as base64 (in parallel with Promise.all)
        const headshotsWithBase64 = await Promise.all(
          shuffledHeadshots.map(async (headshot) => {
            const base64Data = await fetchImageAsBase64(headshot.url);
            return {
              ...headshot,
              base64Data
            };
          })
        );
        
        // Store in cache for extended period
        setCachedHeadshots(headshotsWithBase64);
        
        setHeadshots(headshotsWithBase64);
        toast.success(`Loaded ${headshotsWithBase64.length} headshots`);
      } catch (error) {
        console.error('Error in headshots carousel:', error);
        setError('Failed to load headshots');
        toast.error('Failed to load headshots');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHeadshots();
  }, []);

  return { headshots, loading, error };
};
