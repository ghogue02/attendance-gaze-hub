
import { useState, useMemo } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import BuildersTab from './BuildersTab';

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

  // Filter builders by search query and status (cohort filtering is now handled in Dashboard)
  const filteredBuilders = useMemo(() => {
    let filtered = builders;

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
  }, [builders, searchQuery, statusFilter]);

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
