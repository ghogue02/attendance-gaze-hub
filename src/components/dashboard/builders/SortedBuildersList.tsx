
import { useCallback } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import BuildersList from '../BuildersList';
import { sortBuilders } from '../BuilderFilters';

interface SortedBuildersListProps {
  isLoading: boolean;
  filteredBuilders: Builder[];
  searchQuery: string;
  sortOption: string;
  onClearFilters: () => void;
  onVerify: (builderId: string, status: BuilderStatus, reason?: string) => void;
  onDeleteRequest: (builderId: string, builderName: string) => void;
  highlightBuilderId?: string;
  highlightedBuilderRef?: React.RefObject<HTMLDivElement>;
}

const SortedBuildersList = ({
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
  // Sort builders based on the selected sort option
  const sortedBuilders = sortBuilders(filteredBuilders, sortOption);
  
  // Handle verify action
  const handleVerify = useCallback((builderId: string, status: BuilderStatus, reason?: string) => {
    onVerify(builderId, status, reason);
  }, [onVerify]);
  
  return (
    <BuildersList
      builders={sortedBuilders}
      isLoading={isLoading}
      searchQuery={searchQuery}
      onClearFilters={onClearFilters}
      onVerify={handleVerify}
      onDeleteRequest={onDeleteRequest}
      highlightBuilderId={highlightBuilderId}
      highlightedBuilderRef={highlightedBuilderRef}
    />
  );
};

export default SortedBuildersList;
