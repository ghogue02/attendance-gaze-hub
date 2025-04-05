
import { useState, useEffect } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import BuildersList from '@/components/dashboard/BuildersList';
import { useBuilderAttendanceRates } from '@/hooks/useBuilderAttendanceRates';

interface SortedBuildersListProps {
  isLoading: boolean;
  filteredBuilders: Builder[];
  searchQuery: string;
  sortOption: string;
  onClearFilters: () => void;
  onVerify: (builderId: string, status: BuilderStatus, reason?: string) => void;
  onDeleteRequest: (builderId: string, builderName: string) => void;
}

const SortedBuildersList = ({
  isLoading,
  filteredBuilders,
  searchQuery,
  sortOption,
  onClearFilters,
  onVerify,
  onDeleteRequest
}: SortedBuildersListProps) => {
  const [sortedBuilders, setSortedBuilders] = useState(filteredBuilders);
  const { builderAttendanceRates } = useBuilderAttendanceRates(filteredBuilders);

  useEffect(() => {
    if (!filteredBuilders.length) {
      setSortedBuilders([]);
      return;
    }

    const builders = [...filteredBuilders];

    switch (sortOption) {
      case 'name':
        builders.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        builders.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'attendance':
        builders.sort((a, b) => {
          const rateA = builderAttendanceRates[a.id] ?? -1;
          const rateB = builderAttendanceRates[b.id] ?? -1;
          return rateB - rateA; // High to Low
        });
        break;
      case 'attendance-desc':
        builders.sort((a, b) => {
          const rateA = builderAttendanceRates[a.id] ?? 101; // Place null values at the end
          const rateB = builderAttendanceRates[b.id] ?? 101;
          return rateA - rateB; // Low to High
        });
        break;
      default:
        builders.sort((a, b) => a.name.localeCompare(b.name));
    }

    setSortedBuilders(builders);
  }, [filteredBuilders, sortOption, builderAttendanceRates]);

  return (
    <BuildersList
      isLoading={isLoading}
      filteredBuilders={sortedBuilders}
      searchQuery={searchQuery}
      onClearFilters={onClearFilters}
      onVerify={onVerify}
      onDeleteRequest={onDeleteRequest}
    />
  );
};

export default SortedBuildersList;
