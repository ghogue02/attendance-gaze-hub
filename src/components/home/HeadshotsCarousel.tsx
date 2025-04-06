
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem 
} from '@/components/ui/carousel';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

interface HeadshotData {
  name: string;
  url: string;
}

const HeadshotsCarousel = () => {
  const [headshots, setHeadshots] = useState<HeadshotData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeadshots = async () => {
      try {
        setLoading(true);
        
        // List all files in the headshots bucket
        const { data: files, error } = await supabase
          .storage
          .from('headshots')
          .list('', {
            sortBy: { column: 'name', order: 'asc' }
          });
          
        if (error) {
          console.error('Error fetching headshots:', error);
          return;
        }
        
        if (!files || files.length === 0) {
          console.log('No headshots found in the bucket');
          setLoading(false);
          return;
        }
        
        // Get public URLs for all image files
        const headshots = files
          .filter(file => file.name.match(/\.(jpeg|jpg|png|webp)$/i))
          .map(file => {
            // Extract builder name from filename (removing extension)
            const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            
            // Generate the public URL for the image
            const url = supabase.storage
              .from('headshots')
              .getPublicUrl(file.name).data.publicUrl;
              
            return { name, url };
          });
        
        // Shuffle the headshots array for random order
        const shuffledHeadshots = [...headshots].sort(() => Math.random() - 0.5);
        
        setHeadshots(shuffledHeadshots);
      } catch (error) {
        console.error('Error in headshots carousel:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHeadshots();
  }, []);
  
  if (loading) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-md border border-dashed">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (headshots.length === 0) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">No headshots available</p>
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
