
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

const BuilderCardMemo = memo(({ 
  builder, 
  onVerify, 
  isHighlighted, 
  attendanceStats,
  onDeleteRequest,
  setRef
}: { 
  builder: Builder, 
  onVerify?: (builderId: string, status: BuilderStatus, reason?: string) => void,
  isHighlighted: boolean,
  attendanceStats: any,
  onDeleteRequest?: (builderId: string, builderName: string) => void,
  setRef: (el: HTMLDivElement | null) => void
}) => {
  return (
    <div 
      ref={setRef}
      className={isHighlighted ? 'ring-4 ring-primary/40 ring-offset-4 ring-offset-background scale-105 z-10 transition-all duration-500' : ''}
    >
      <BuilderCard 
        builder={builder} 
        onVerify={onVerify} 
        attendanceStats={attendanceStats}
        onDeleteRequest={onDeleteRequest ? () => onDeleteRequest(builder.id, builder.name) : undefined}
      />
    </div>
  );
});

BuilderCardMemo.displayName = 'BuilderCardMemo';

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
  
  // Sort builders based on the selected sort option - memoized to prevent unnecessary sorts
  const sortedBuilders = useMemo(() => {
    return sortBuilders(filteredBuilders, sortOption, builderAttendanceStats);
  }, [filteredBuilders, sortOption, builderAttendanceStats]);
  
  // Loading state
  if (isLoading || attendanceRatesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] rounded-xl" />
        ))}
      </div>
    );
  }
  
  // No results state
  if (sortedBuilders.length === 0) {
    return (
      <NoResultsState 
        searchQuery={searchQuery}
        onClearFilters={onClearFilters}
      />
    );
  }
  
  // Create a ref callback function
  const getRefCallback = (builderId: string) => {
    if (builderId === highlightBuilderId && highlightedBuilderRef) {
      return (element: HTMLDivElement | null) => {
        if (element && highlightedBuilderRef && 'current' in highlightedBuilderRef) {
          (highlightedBuilderRef as React.MutableRefObject<HTMLDivElement | null>).current = element;
        }
      };
    }
    return () => {};
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedBuilders.map((builder) => (
        <BuilderCardMemo 
          key={builder.id}
          builder={builder}
          onVerify={onVerify}
          isHighlighted={highlightBuilderId === builder.id}
          attendanceStats={builderAttendanceStats?.[builder.id] || null}
          onDeleteRequest={onDeleteRequest ? () => onDeleteRequest(builder.id, builder.name) : undefined}
          setRef={getRefCallback(builder.id)}
        />
      ))}
    </div>
  );
});

SortedBuildersList.displayName = 'SortedBuildersList';

export default SortedBuildersList;
