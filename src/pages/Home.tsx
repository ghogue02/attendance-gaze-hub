import { useState, useEffect, useRef } from 'react';
import { Builder } from '@/components/builder/types';
import { PhotoCapture } from '@/components/PhotoCapture';
import Header from '@/components/Header';
import { RecognitionResult } from '@/components/home/RecognitionResult';
import { getAllBuilders, clearAttendanceCache } from '@/utils/faceRecognition/attendance';
import { Loader2, Search, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PresentBuildersCarousel from '@/components/home/PresentBuildersCarousel';
import { trackedSupabase as supabase } from '@/integrations/supabase/trackedClient';
import { getCurrentDateString } from '@/utils/date/dateUtils';
import HeadshotsCarousel from '@/components/home/HeadshotsCarousel';
import { subscribeToAttendanceChanges } from '@/services/attendance/realtime';
import { trackRequest } from '@/utils/debugging/requestTracker';

const Home = () => {
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [detectedBuilder, setDetectedBuilder] = useState<Builder | null>(null);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Track component mounting to help with debugging
    trackRequest('Home', 'component-mount');
    
    const loadBuilders = async () => {
      setLoading(true);
      try {
        // Use the current date in YYYY-MM-DD format
        const today = getCurrentDateString();
        console.log(`Home: Loading builders for date: ${today}`);
        trackRequest('Home', 'load-builders', today);
        
        // Use the optimized function that returns cached data when available
        const data = await getAllBuilders(today);
        console.log(`Home: Loaded ${data.length} builders, ${data.filter(b => b.status === 'present').length} present`);
        setBuilders(data);
        trackRequest('Home', 'builders-loaded', `count: ${data.length}`);
      } catch (error) {
        console.error('Error loading builders:', error);
        trackRequest('Home', 'load-error', String(error));
      } finally {
        setLoading(false);
      }
    };

    loadBuilders();
    
    // Use the optimized subscription handler
    let unsubscribe: () => void;
    
    // Delay subscription setup to reduce initial load
    const subscriptionTimeout = setTimeout(() => {
      trackRequest('Home', 'setup-subscription');
      unsubscribe = subscribeToAttendanceChanges(() => {
        console.log('Home: Attendance change detected, reloading builders');
        trackRequest('Home', 'subscription-triggered');
        // Clear the cache for today
        clearAttendanceCache(getCurrentDateString());
        // Reload data
        loadBuilders();
      });
    }, 2000); // 2 second delay
    
    return () => {
      trackRequest('Home', 'component-unmount');
      clearTimeout(subscriptionTimeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleSuccess = (builder: Builder) => {
    trackRequest('Home', 'builder-detected', builder.name);
    setDetectedBuilder(builder);
  };

  const handleReset = () => {
    trackRequest('Home', 'reset');
    setDetectedBuilder(null);
    setSelectedBuilder(null);
    setSearchQuery('');
  };
  
  // Filter builders based on search query
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
            <div className="grid md:grid-cols-2 gap-6">
              <HeadshotsCarousel />
              
              <div className="glass-card p-6 rounded-lg shadow-sm w-full">
                <h2 className="text-xl font-semibold mb-4 text-center">Search by Name</h2>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="builder-search"
                    placeholder="Type builder name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      trackRequest('Home', 'search-query', e.target.value);
                    }}
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
                          onClick={() => {
                            setSelectedBuilder(builder);
                            trackRequest('Home', 'select-builder', builder.name);
                          }}
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
                    onClick={() => {
                      setSelectedBuilder(null);
                      trackRequest('Home', 'deselect-builder');
                    }}
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
