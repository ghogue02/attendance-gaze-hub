
import { useState, useMemo } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import BuildersTab from './BuildersTab';
import { useCohortSelection } from '@/hooks/useCohortSelection';

interface BuildersTabWrapperProps {
  builders: Builder[];
  isLoading: boolean;
  onVerify: (builderId: string, status: BuilderStatus, reason?: string) => void;
  refreshData: () => void;
  highlightBuilderId?: string;
}

const BuildersTabWrapper = ({ 
  builders, 
  isLoading, 
  onVerify, 
  refreshData, 
  highlightBuilderId 
}: BuildersTabWrapperProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const { selectedCohort } = useCohortSelection();

  // Filter builders by cohort and other filters
  const filteredBuilders = useMemo(() => {
    let filtered = builders;

    // Filter by cohort
    if (selectedCohort !== 'All Cohorts') {
      filtered = filtered.filter(builder => builder.cohort === selectedCohort);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(builder =>
        builder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        builder.builderId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(builder => builder.status === statusFilter);
    }

    return filtered;
  }, [builders, selectedCohort, searchQuery, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <BuildersTab
      isLoading={isLoading}
      filteredBuilders={filteredBuilders}
      searchQuery={searchQuery}
      statusFilter={statusFilter}
      setSearchQuery={setSearchQuery}
      setStatusFilter={setStatusFilter}
      onClearFilters={handleClearFilters}
      onVerify={onVerify}
      refreshData={refreshData}
      highlightBuilderId={highlightBuilderId}
    />
  );
};

export default BuildersTabWrapper;
