import { Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface NoResultsStateProps {
  searchQuery?: string;
  onClearFilters?: () => void;
  noBuilders?: boolean;
}

const NoResultsState = ({ 
  searchQuery, 
  onClearFilters,
  noBuilders = false
}: NoResultsStateProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <SearchIcon size={24} />
      </div>
      
      {noBuilders ? (
        <>
          <h3 className="text-xl font-semibold mb-2">No builders added yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start by adding your first builder to the system.
          </p>
          <Button onClick={() => navigate('/register')} className="mt-2">
            Add Your First Builder
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold mb-2">No results found</h3>
          {searchQuery && (
            <p className="text-muted-foreground mb-6">
              No builders match the search query "{searchQuery}"
            </p>
          )}
          {onClearFilters && (
            <Button onClick={onClearFilters} variant="outline" className="mt-2">
              Clear filters
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default NoResultsState;
