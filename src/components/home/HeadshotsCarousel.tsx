
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

interface HeadshotData {
  name: string;
  url: string;
}

// Create a module-level cache with expiration
const HEADSHOTS_CACHE_KEY = 'headshots_carousel_data';
const HEADSHOTS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Utility to get cached headshots
const getCachedHeadshots = (): HeadshotData[] | null => {
  try {
    const cachedData = localStorage.getItem(HEADSHOTS_CACHE_KEY);
    if (!cachedData) return null;
    
    const { data, timestamp } = JSON.parse(cachedData);
    
    // Check if cache is still valid
    if (Date.now() - timestamp < HEADSHOTS_CACHE_TTL) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading headshots cache:', error);
    return null;
  }
};

// Utility to cache headshots
const setCachedHeadshots = (data: HeadshotData[]): void => {
  try {
    const cacheObject = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(HEADSHOTS_CACHE_KEY, JSON.stringify(cacheObject));
  } catch (error) {
    console.error('Error setting headshots cache:', error);
  }
};

const HeadshotsCarousel = () => {
  const [headshots, setHeadshots] = useState<HeadshotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeadshots = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check for cached data first
        const cachedHeadshots = getCachedHeadshots();
        if (cachedHeadshots && cachedHeadshots.length > 0) {
          console.log(`Using cached headshots data (${cachedHeadshots.length} items)`);
          setHeadshots(cachedHeadshots);
          setLoading(false);
          return;
        }
        
        console.log('No valid cache found, fetching headshots from storage...');
        
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
        
        // Instead of making separate getPublicUrl calls for each file,
        // we'll construct the URLs directly since we know the bucket is public
        const baseUrl = 'https://emswwbojtxipisaqfmrk.supabase.co/storage/v1/object/public/headshots/';
        
        // Process headshots in a more efficient way
        const processedHeadshots: HeadshotData[] = imageFiles.map(file => {
          // Extract builder name from filename (removing extension)
          const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          
          // Construct URL with proper encoding for spaces and special characters
          const encodedFileName = encodeURIComponent(file.name);
          const url = `${baseUrl}${encodedFileName}`;
          
          console.log(`Generated URL for ${name}: ${url}`);
          
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
        
        // Store in cache for future use
        setCachedHeadshots(shuffledHeadshots);
        
        setHeadshots(shuffledHeadshots);
        toast.success(`Loaded ${shuffledHeadshots.length} headshots`);
      } catch (error) {
        console.error('Error in headshots carousel:', error);
        setError('Failed to load headshots');
        toast.error('Failed to load headshots');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHeadshots();
    
    // Add cache invalidation listener (e.g., when a new headshot is uploaded)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === HEADSHOTS_CACHE_KEY) {
        console.log('Headshots cache updated in another tab, refreshing data');
        const newCache = getCachedHeadshots();
        if (newCache) {
          setHeadshots(newCache);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
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
                    src={headshot.url} 
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
