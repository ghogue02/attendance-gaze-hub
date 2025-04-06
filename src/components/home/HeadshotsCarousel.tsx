
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem 
} from '@/components/ui/carousel';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface HeadshotData {
  name: string;
  url: string;
}

const HeadshotsCarousel = () => {
  const [headshots, setHeadshots] = useState<HeadshotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeadshots = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching headshots from Supabase storage...');
        
        // List all files in the headshots bucket
        const { data: files, error } = await supabase
          .storage
          .from('headshots')
          .list('', {
            sortBy: { column: 'name', order: 'asc' }
          });
          
        if (error) {
          console.error('Error fetching headshots:', error);
          setError(`Error fetching headshots: ${error.message}`);
          return;
        }
        
        if (!files || files.length === 0) {
          console.log('No headshots found in the bucket');
          setError('No headshots found in the storage bucket');
          setLoading(false);
          return;
        }
        
        console.log(`Found ${files.length} files in headshots bucket:`, files.map(f => f.name).join(', '));
        
        // Get public URLs for all image files
        const headshots = files
          .filter(file => file.name.match(/\.(jpeg|jpg|png|webp|gif|bmp)$/i))
          .map(file => {
            // Extract builder name from filename (removing extension)
            const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            
            // Generate the public URL for the image
            const url = supabase.storage
              .from('headshots')
              .getPublicUrl(file.name).data.publicUrl;
              
            console.log(`Generated URL for ${file.name}: ${url}`);
            return { name, url };
          });
        
        if (headshots.length === 0) {
          setError('No image files found in the headshots bucket');
          setLoading(false);
          return;
        }
        
        // Shuffle the headshots array for random order
        const shuffledHeadshots = [...headshots].sort(() => Math.random() - 0.5);
        console.log(`Prepared ${shuffledHeadshots.length} headshots for carousel`);
        
        setHeadshots(shuffledHeadshots);
        toast.success(`Loaded ${shuffledHeadshots.length} headshots`);
      } catch (error) {
        console.error('Error in headshots carousel:', error);
        setError('Failed to load headshots');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHeadshots();
  }, []);
  
  if (loading) {
    return (
      <div className="glass-card p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">Builder Spotlights</h2>
        <div className="flex flex-col items-center justify-center space-y-4">
          <Skeleton className="w-40 h-40 rounded-full" />
          <Skeleton className="w-32 h-8" />
          <p className="text-sm text-muted-foreground">Loading headshots...</p>
        </div>
      </div>
    );
  }
  
  if (error || headshots.length === 0) {
    return (
      <div className="glass-card p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">Builder Spotlights</h2>
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">{error || 'No headshots available'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-card p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-center">Builder Spotlights</h2>
      <Carousel 
        autoplay={true} 
        autoplayInterval={3000} 
        className="w-full"
        opts={{ loop: true }}
      >
        <CarouselContent>
          {headshots.map((headshot, index) => (
            <CarouselItem key={index} className="flex flex-col items-center">
              <div className="relative w-40 h-40 mx-auto mb-4">
                <Avatar className="w-40 h-40">
                  <AvatarImage 
                    src={headshot.url} 
                    alt={headshot.name}
                    className="object-cover" 
                  />
                  <AvatarFallback className="text-4xl">
                    {headshot.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h3 className="text-center font-medium">{headshot.name}</h3>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default HeadshotsCarousel;
