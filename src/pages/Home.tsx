
import { useState } from 'react';
import { Builder } from '@/components/builder/types';
import { PhotoCapture } from '@/components/PhotoCapture';
import Header from '@/components/Header';
import { RecognitionResult } from '@/components/home/RecognitionResult';
import { getAllBuilders } from '@/utils/faceRecognition';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Home = () => {
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [detectedBuilder, setDetectedBuilder] = useState<Builder | null>(null);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBuilders = async () => {
      setLoading(true);
      try {
        const data = await getAllBuilders();
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
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-md mx-auto pt-20 pb-16 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Attendance System</h1>
        
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
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="builder-select" className="text-sm font-medium">
                Select Builder
              </label>
              <Select
                value={selectedBuilder?.id || ''}
                onValueChange={(value) => {
                  const builder = builders.find(b => b.id === value);
                  setSelectedBuilder(builder || null);
                }}
              >
                <SelectTrigger id="builder-select">
                  <SelectValue placeholder="Select a builder" />
                </SelectTrigger>
                <SelectContent>
                  {builders.map((builder) => (
                    <SelectItem key={builder.id} value={builder.id}>
                      {builder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedBuilder ? (
              <PhotoCapture
                builder={selectedBuilder}
                onSuccess={handleSuccess}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please select a builder to continue
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
