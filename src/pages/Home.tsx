
import { useState } from 'react';
import { Builder } from '@/components/builder/types';
import { PhotoCapture } from '@/components/PhotoCapture';
import Header from '@/components/Header';
import { RecognitionResult } from '@/components/home/RecognitionResult';
import { getAllBuilders } from '@/utils/faceRecognition';
import { useEffect } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

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
        // Get the current date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        const data = await getAllBuilders(today);
        setBuilders(data);
      } catch (error) {
        console.error('Error loading builders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBuilders();
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
      
      <main className="container max-w-md mx-auto pt-16 pb-16 px-4 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-8 text-center">Attendance Tracker</h1>
        
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
            {selectedBuilder ? (
              <div className="glass-card p-6 rounded-lg shadow-sm w-full">
                <PhotoCapture
                  builder={selectedBuilder}
                  onSuccess={handleSuccess}
                />
                <Button 
                  variant="ghost" 
                  className="mt-4 mx-auto block" 
                  onClick={() => setSelectedBuilder(null)}
                >
                  Select different builder
                </Button>
              </div>
            ) : (
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
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
