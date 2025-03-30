
import { useState } from 'react';
import { Builder } from '@/components/builder/types';
import { PhotoCapture } from '@/components/PhotoCapture';
import Header from '@/components/Header';
import { RecognitionResult } from '@/components/home/RecognitionResult';
import { getAllBuilders } from '@/utils/faceRecognition';
import { useEffect } from 'react';
import { Loader2, Search, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PresentBuildersCarousel from '@/components/home/PresentBuildersCarousel';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentDateString } from '@/utils/date/dateUtils';

const Home = () => {
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [detectedBuilder, setDetectedBuilder] = useState<Builder | null>(null);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadBuilders = async () => {
      setLoading(true);
      try {
        // Use the current date in YYYY-MM-DD format
        const today = getCurrentDateString();
        console.log(`Home: Loading builders for date: ${today}`);
        
        const data = await getAllBuilders(today);
        console.log(`Home: Loaded ${data.length} builders, ${data.filter(b => b.status === 'present').length} present`);
        setBuilders(data);
      } catch (error) {
        console.error('Error loading builders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBuilders();
    
    // Subscribe to attendance changes to reload builders when attendance is updated
    const today = getCurrentDateString();
    console.log(`Home: Setting up subscription for date: ${today}`);
    
    const channel = supabase
      .channel('home-attendance-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance', filter: `date=eq.${today}` },
        () => {
          console.log('Home: Attendance change detected, reloading builders');
          loadBuilders();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSuccess = (builder: Builder) => {
    setDetectedBuilder(builder);
  };

  const handleReset = () => {
    setDetectedBuilder(null);
    setSelectedBuilder(null);
    setSearchQuery('');
  };
  
  const filteredBuilders = searchQuery 
    ? builders.filter(builder => 
        builder.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl mx-auto pt-16 pb-16 px-4 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-8 text-center text-primary">Attendance Tracker</h1>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : detectedBuilder ? (
          <RecognitionResult 
            detectedBuilder={detectedBuilder} 
            passiveMode={false} 
            reset={handleReset} 
          />
        ) : (
          <div className="space-y-8 w-full">
            <div className="glass-card p-6 rounded-lg shadow-sm w-full">
              <h2 className="text-xl font-semibold mb-4 text-center">Search by Name</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  id="builder-search"
                  placeholder="Type builder name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-6 text-lg"
                  autoFocus
                />
              </div>
              
              {searchQuery.length > 0 && (
                <div className="border rounded-md max-h-60 overflow-y-auto">
                  {filteredBuilders.length > 0 ? (
                    filteredBuilders.map((builder) => (
                      <div 
                        key={builder.id}
                        className="p-3 hover:bg-secondary cursor-pointer flex items-center gap-2 border-b last:border-b-0"
                        onClick={() => setSelectedBuilder(builder)}
                      >
                        {builder.image ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img src={builder.image} alt={builder.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {builder.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium">{builder.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No builders found
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="glass-card p-6 rounded-lg shadow-sm w-full flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Camera size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-center">Photo Capture</h2>
              <p className="text-muted-foreground text-center mb-2">
                {selectedBuilder ? 
                  <>Take a photo to mark attendance</> : 
                  <>Find your name, then take a photo</>
                }
              </p>
              
              {selectedBuilder && (
                <>
                  <PhotoCapture
                    builder={selectedBuilder}
                    onSuccess={handleSuccess}
                  />
                  <Button 
                    variant="ghost" 
                    className="mt-4" 
                    onClick={() => setSelectedBuilder(null)}
                  >
                    Select different builder
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        
        {!loading && <PresentBuildersCarousel initialBuilders={builders} />}
      </main>
    </div>
  );
};

export default Home;
