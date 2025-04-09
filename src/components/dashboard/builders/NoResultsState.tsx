
import { FC } from 'react';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoResultsStateProps {
  searchQuery: string;
  onClearFilters: () => void;
}

const NoResultsState: FC<NoResultsStateProps> = ({ searchQuery, onClearFilters }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-secondary/30 p-4 rounded-full mb-4">
        <SearchX className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-medium mb-2">No builders found</h3>
      <p className="text-muted-foreground text-center mb-6 max-w-md">
        {searchQuery 
          ? `No builders match your search for "${searchQuery}"`
          : "No builders match your current filter criteria"
        }
      </p>
      <Button onClick={onClearFilters}>
        Clear Filters
      </Button>
    </div>
  );
};

export default NoResultsState;
