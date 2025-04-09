
import { memo } from 'react';
import { BuilderStatus } from '@/components/builder/types';
import BuildersList from '@/components/dashboard/BuildersList';
import { sortBuilders } from '@/components/dashboard/BuilderFilters';

interface SortedBuildersListProps {
  isLoading: boolean;
  filteredBuilders: any[];
  searchQuery: string;
  sortOption: string;
  onClearFilters: () => void;
  onVerify: (builderId: string, status: BuilderStatus, reason?: string) => void;
  onDeleteRequest: (builderId: string, builderName: string) => void;
  highlightBuilderId?: string;
  highlightedBuilderRef?: React.RefObject<HTMLDivElement>;
}

const SortedBuildersList = memo(({
  isLoading,
  filteredBuilders,
  searchQuery,
  sortOption,
  onClearFilters,
  onVerify,
  onDeleteRequest,
  highlightBuilderId,
  highlightedBuilderRef
}: SortedBuildersListProps) => {
  // Apply sorting to the filtered builders
  const sortedBuilders = sortBuilders(filteredBuilders, sortOption);
  
  return (
    <BuildersList 
      isLoading={isLoading}
      builders={sortedBuilders}
      searchQuery={searchQuery}
      onClearFilters={onClearFilters}
      onVerify={onVerify}
      onDeleteRequest={onDeleteRequest}
      highlightBuilderId={highlightBuilderId}
      highlightedBuilderRef={highlightedBuilderRef}
    />
  );
});

SortedBuildersList.displayName = 'SortedBuildersList';

export default SortedBuildersList;
