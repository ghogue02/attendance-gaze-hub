
import { useState } from 'react';
import { Builder } from '@/components/builder/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Camera } from 'lucide-react';
import { trackRequest } from '@/utils/debugging/requestTracker';

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

  const filteredBuilders = searchQuery 
    ? builders.filter(builder => 
        builder.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    trackRequest('Home', 'search-query', e.target.value);
  };

  const handleClearSelection = () => {
    onSelectBuilder({} as Builder);
    setSearchQuery('');
    trackRequest('Home', 'deselect-builder');
  };

  return (
    <div className="glass-card p-6 rounded-lg shadow-sm w-full">
      <h2 className="text-xl font-semibold mb-4 text-center">Search by Name</h2>
      
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
                    onClick={() => onSelectBuilder(builder)}
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
                />
              ) : (
                selectedBuilder.name.charAt(0)
              )}
            </div>
            <div>
              <div className="font-medium">{selectedBuilder.name}</div>
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
