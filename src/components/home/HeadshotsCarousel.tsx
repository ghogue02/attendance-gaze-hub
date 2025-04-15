
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from '@/components/ui/carousel';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  HeadshotData,
  getCachedHeadshots, 
  setCachedHeadshots, 
  isHeadshotCacheValid,
  fetchImageAsBase64 
} from '@/utils/headshots/headshotCache';

const HeadshotsCarousel = () => {
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

  // Loading state
  if (loading) {
    return (
      <div className="glass-card p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">Builder Spotlights</h2>
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
          <Skeleton className="w-40 h-40 rounded-full" />
          <Skeleton className="w-32 h-8" />
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading headshots...
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || headshots.length === 0) {
    return (
      <div className="glass-card p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">Builder Spotlights</h2>
        <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-2">{error || 'No headshots available'}</p>
          <p className="text-xs text-muted-foreground/80">
            Check Supabase storage bucket "headshots" for image files
          </p>
        </div>
      </div>
    );
  }
  
  // Success state with carousel
  return (
    <div className="glass-card p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-center">Builder Spotlights</h2>
      <Carousel 
        className="w-full"
        opts={{ 
          loop: true,
          dragFree: true
        }}
        autoplay={true}
        autoplayInterval={5000}
      >
        <CarouselContent>
          {headshots.map((headshot, index) => (
            <CarouselItem key={index} className="flex flex-col items-center basis-full md:basis-1/2 lg:basis-1/3">
              <div className="relative w-40 h-40 mx-auto mb-4">
                <Avatar className="w-40 h-40 border-2 border-primary/10">
                  <AvatarImage 
                    src={headshot.base64Data || headshot.url} 
                    alt={headshot.name}
                    className="object-cover" 
                    onError={(e) => {
                      console.error(`Error loading image for ${headshot.name}`);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <AvatarFallback className="text-4xl bg-primary/10">
                    {headshot.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h3 className="text-center font-medium text-lg">{headshot.name}</h3>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious className="absolute -left-4 top-1/2" />
          <CarouselNext className="absolute -right-4 top-1/2" />
        </div>
      </Carousel>
      <p className="text-center text-xs text-muted-foreground mt-4">
        {headshots.length} builder{headshots.length !== 1 ? 's' : ''} featured
      </p>
    </div>
  );
};

export default HeadshotsCarousel;
