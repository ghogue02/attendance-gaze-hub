
import React, { useMemo, memo } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import BuilderCard from '@/components/builder/BuilderCard';
import { useBuilderAttendanceRates } from '@/hooks/useBuilderAttendanceRates';
import { sortBuilders } from '@/components/dashboard/BuilderFilters';
import { Skeleton } from '@/components/ui/skeleton';
import NoResultsState from './NoResultsState';

interface SortedBuildersListProps {
  builders: Builder[];
  onVerify?: (builderId: string, status: BuilderStatus, reason?: string) => void;
  highlightBuilderId?: string;
  isLoading: boolean;
  filteredBuilders: Builder[];
  searchQuery: string;
  sortOption: string;
  onClearFilters: () => void;
  onDeleteRequest?: (builderId: string, builderName: string) => void;
  highlightedBuilderRef?: React.RefObject<HTMLDivElement>;
}

const SortedBuildersList = memo(({ 
  builders, 
  onVerify, 
  highlightBuilderId,
  isLoading,
  filteredBuilders,
  searchQuery,
  sortOption,
  onClearFilters,
  onDeleteRequest,
  highlightedBuilderRef
}: SortedBuildersListProps) => {
  // Fetch attendance stats for all builders
  const { builderAttendanceStats, isLoading: attendanceRatesLoading } = useBuilderAttendanceRates(builders);
  
  // Sort builders based on the selected sort option
  const sortedBuilders = useMemo(() => {
    console.log(`Applying sort option: ${sortOption} to ${filteredBuilders.length} builders`);
    return sortBuilders(filteredBuilders, sortOption, builderAttendanceStats);
  }, [filteredBuilders, sortOption, builderAttendanceStats]);
  
  // Debug log for sorting
  console.log(`[SortedBuildersList] Sorted ${sortedBuilders.length} builders with option: ${sortOption}`);
  
  if (isLoading || attendanceRatesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] rounded-xl" />
        ))}
      </div>
    );
  }
  
  if (sortedBuilders.length === 0) {
    return (
      <NoResultsState 
        searchQuery={searchQuery}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedBuilders.map((builder) => {
        const isHighlighted = highlightBuilderId === builder.id;
        
        return (
          <div 
            key={builder.id}
            ref={isHighlighted && highlightedBuilderRef ? (element) => {
              if (isHighlighted && element && highlightedBuilderRef) {
                (highlightedBuilderRef as React.MutableRefObject<HTMLDivElement | null>).current = element;
              }
            } : undefined}
            className={isHighlighted ? 'ring-4 ring-primary/40 ring-offset-4 ring-offset-background scale-105 z-10 transition-all duration-500' : ''}
          >
            <BuilderCard 
              builder={builder} 
              onVerify={onVerify} 
              attendanceStats={builderAttendanceStats?.[builder.id] || null}
              onDeleteRequest={onDeleteRequest ? () => onDeleteRequest(builder.id, builder.name) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
});

SortedBuildersList.displayName = 'SortedBuildersList';

export default SortedBuildersList;
