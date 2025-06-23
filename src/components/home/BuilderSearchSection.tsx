
import { useState } from 'react';
import { Builder } from '@/components/builder/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Camera, Bug } from 'lucide-react';
import { trackRequest } from '@/utils/debugging/requestTracker';
import { debugBuilderIssues, validateBuilderSelection, clearProblematicBuilderCache } from '@/utils/debugging/builderDebugUtils';
import { toast } from 'sonner';

interface BuilderSearchSectionProps {
  builders: Builder[];
  selectedBuilder: Builder | null;
  onSelectBuilder: (builder: Builder) => void;
}

const BuilderSearchSection = ({ 
  builders, 
  selectedBuilder, 
  onSelectBuilder 
}: BuilderSearchSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDebugging, setIsDebugging] = useState(false);

  const filteredBuilders = searchQuery 
    ? builders.filter(builder => 
        builder.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    trackRequest('Home', 'search-query', e.target.value);
  };

  const handleSelectBuilder = (builder: Builder) => {
    console.log(`[BuilderSearchSection] Builder selected: ${builder.name} (ID: ${builder.id})`);
    
    // Validate the selection
    const isValid = validateBuilderSelection(builder, builder.name);
    if (!isValid) {
      console.error('[BuilderSearchSection] Invalid builder selection detected!');
      return;
    }
    
    onSelectBuilder(builder);
    setSearchQuery('');
    trackRequest('Home', 'select-builder', builder.name);
  };

  const handleClearSelection = () => {
    onSelectBuilder({} as Builder);
    setSearchQuery('');
    trackRequest('Home', 'deselect-builder');
  };

  const handleDebugIssues = async () => {
    setIsDebugging(true);
    try {
      // Debug the specific problematic builders
      const problematicNames = ['Mahkeddah', 'Cherice'];
      const results = await debugBuilderIssues(problematicNames);
      
      if (results && results.length > 0) {
        const builderIds = results.map(b => b.id);
        clearProblematicBuilderCache(builderIds);
        toast.success('Debug investigation completed - check console for details');
      }
    } catch (error) {
      console.error('Debug investigation failed:', error);
      toast.error('Debug investigation failed');
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-lg shadow-sm w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-center">Search by Name</h2>
        <Button
          onClick={handleDebugIssues}
          variant="outline"
          size="sm"
          disabled={isDebugging}
          className="flex items-center gap-1"
        >
          <Bug size={14} />
          {isDebugging ? 'Debugging...' : 'Debug Issues'}
        </Button>
      </div>
      
      {!selectedBuilder?.id ? (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              id="builder-search"
              placeholder="Type builder name..."
              value={searchQuery}
              onChange={handleSearchChange}
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
                    onClick={() => handleSelectBuilder(builder)}
                  >
                    {builder.image ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img 
                          src={builder.image} 
                          alt={builder.name} 
                          className="w-full h-full object-cover"
                          onError={() => console.warn(`[BuilderSearchSection] Image load error for ${builder.name} (${builder.id})`)}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {builder.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium">{builder.name}</span>
                      <span className="text-xs text-muted-foreground">ID: {builder.id}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No builders found
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="mt-2 p-3 bg-primary/5 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium overflow-hidden">
              {selectedBuilder.image ? (
                <img 
                  src={selectedBuilder.image} 
                  alt={selectedBuilder.name}
                  className="h-full w-full object-cover"
                  onError={() => console.warn(`[BuilderSearchSection] Selected image load error for ${selectedBuilder.name} (${selectedBuilder.id})`)}
                />
              ) : (
                selectedBuilder.name.charAt(0)
              )}
            </div>
            <div>
              <div className="font-medium">{selectedBuilder.name}</div>
              <div className="text-xs text-muted-foreground">ID: {selectedBuilder.id}</div>
            </div>
          </div>
          <Button 
            onClick={handleClearSelection}
            variant="ghost" 
            size="sm"
          >
            Change Builder
          </Button>
        </div>
      )}
    </div>
  );
};

export default BuilderSearchSection;
