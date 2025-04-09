
import { FC, useRef, useCallback } from 'react';
import { BuilderStatus, Builder } from '@/components/builder/types';
import BuilderCard from '@/components/builder/BuilderCard';
import { Skeleton } from '@/components/ui/skeleton';
import NoResultsState from './builders/NoResultsState';

interface BuildersListProps {
  builders: Builder[];
  isLoading: boolean;
  searchQuery: string;
  onClearFilters: () => void;
  onVerify: (builderId: string, status: BuilderStatus, reason?: string) => void;
  onDeleteRequest?: (builderId: string, builderName: string) => void;
  highlightBuilderId?: string;
  highlightedBuilderRef?: React.RefObject<HTMLDivElement>;
}

const BuildersList: FC<BuildersListProps> = ({
  builders,
  isLoading,
  searchQuery,
  onClearFilters,
  onVerify,
  onDeleteRequest,
  highlightBuilderId,
  highlightedBuilderRef
}) => {
  
  // Create a memoized ref callback function to set refs dynamically
  const setBuilderRef = useCallback(
    (element: HTMLDivElement | null, builderId: string) => {
      if (highlightBuilderId === builderId && element && highlightedBuilderRef) {
        highlightedBuilderRef.current = element;
      }
    },
    [highlightBuilderId, highlightedBuilderRef]
  );
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] rounded-xl" />
        ))}
      </div>
    );
  }
  
  if (builders.length === 0) {
    return (
      <NoResultsState 
        searchQuery={searchQuery} 
        onClearFilters={onClearFilters}
      />
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {builders.map(builder => (
        <div 
          key={builder.id}
          ref={(element) => setBuilderRef(element, builder.id)}
          className={`transition-all duration-500 ${
            highlightBuilderId === builder.id
              ? 'ring-4 ring-primary/40 ring-offset-4 ring-offset-background scale-105 z-10'
              : ''
          }`}
        >
          <BuilderCard
            builder={builder}
            onVerify={onVerify}
            onDeleteRequest={onDeleteRequest ? () => onDeleteRequest(builder.id, builder.name) : undefined}
          />
        </div>
      ))}
    </div>
  );
};

export default BuildersList;
