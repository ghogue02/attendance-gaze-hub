
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
}

export const EmptyState = ({ searchQuery, onClearSearch }: EmptyStateProps) => {
  return (
    <div className="text-center py-10 glass-card">
      <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
      <p className="text-lg font-medium">No builders found</p>
      <p className="text-sm text-muted-foreground">No results match your search criteria.</p>
      {searchQuery && (
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onClearSearch}
        >
          Clear Search
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
