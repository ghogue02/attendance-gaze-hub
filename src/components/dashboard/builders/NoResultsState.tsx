
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";

interface NoResultsStateProps {
  searchQuery: string;
  onClearFilters: () => void;
}

const NoResultsState = ({ searchQuery, onClearFilters }: NoResultsStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground" />
      <h3 className="text-lg font-semibold">No builders found</h3>
      
      {searchQuery ? (
        <p className="text-muted-foreground max-w-md">
          No results found for "{searchQuery}". Try adjusting your search or filters.
        </p>
      ) : (
        <p className="text-muted-foreground max-w-md">
          No builders match the current filters. Try adjusting your filters.
        </p>
      )}
      
      <Button onClick={onClearFilters} variant="outline">
        Clear Filters
      </Button>
    </div>
  );
};

export default NoResultsState;
