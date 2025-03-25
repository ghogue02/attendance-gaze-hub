
import { Camera, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Builder } from '@/components/BuilderCard';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Label } from '@/components/ui/label';

interface AttendanceSectionProps {
  isCameraActive: boolean;
  detectedBuilder: Builder | null;
  startAttendance: () => void;
  reset: () => void;
  onSelectBuilder: (builder: Builder) => void;
  builders: Builder[];
}

export const AttendanceSection = ({ 
  isCameraActive,
  detectedBuilder,
  startAttendance,
  reset,
  onSelectBuilder,
  builders
}: AttendanceSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);

  const filteredBuilders = searchQuery 
    ? builders.filter(builder => 
        builder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        builder.builderId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectBuilder = (builder: Builder) => {
    setSelectedBuilder(builder);
    onSelectBuilder(builder);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="glass-card p-6">
        {detectedBuilder ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-md">
              Builder detected: {detectedBuilder.name}
            </div>
            
            <Button
              onClick={reset}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              Next Builder
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {!isCameraActive ? (
              <>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="builder-search"
                    placeholder="Search by name or builder ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {searchQuery.length > 0 && (
                  <div className="mt-2 border rounded-md max-h-60 overflow-y-auto">
                    {filteredBuilders.length > 0 ? (
                      filteredBuilders.map(builder => (
                        <div 
                          key={builder.id}
                          className="p-2 hover:bg-secondary cursor-pointer flex items-center justify-between"
                          onClick={() => handleSelectBuilder(builder)}
                        >
                          <div className="flex items-center gap-2">
                            {builder.image ? (
                              <div className="w-8 h-8 rounded-full overflow-hidden">
                                <img src={builder.image} alt={builder.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                {builder.name.charAt(0)}
                              </div>
                            )}
                            <span>{builder.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{builder.builderId}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No builders found
                      </div>
                    )}
                  </div>
                )}
                
                {selectedBuilder && (
                  <div className="mt-2 p-3 bg-primary/5 rounded-md flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {selectedBuilder.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{selectedBuilder.name}</div>
                        <div className="text-xs text-muted-foreground">{selectedBuilder.builderId}</div>
                      </div>
                    </div>
                    <Button 
                      onClick={startAttendance}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Camera size={16} />
                      Take Photo
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Camera is active. Position yourself in the frame...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
