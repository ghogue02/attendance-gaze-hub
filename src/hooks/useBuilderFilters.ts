
import { useState, useEffect } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';

interface FilterParams {
  builders: Builder[];
}

interface FilterReturn {
  filteredBuilders: Builder[];
  searchQuery: string;
  statusFilter: BuilderStatus | 'all';
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: BuilderStatus | 'all') => void;
  handleClearFilters: () => void;
}

/**
 * Hook to manage filtering of builders by search query and status
 */
export const useBuilderFilters = ({ builders }: FilterParams): FilterReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]);

  // Effect for filtering
  useEffect(() => {
    console.log('[useBuilderFilters] Filtering effect running...');
    let results = [...builders];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(builder =>
        builder.name.toLowerCase().includes(query) ||
        (builder.builderId && builder.builderId.toLowerCase().includes(query))
      );
    }
    
    if (statusFilter !== 'all') {
      results = results.filter(builder => builder.status === statusFilter);
    }
    
    console.log(`[useBuilderFilters] Setting filteredBuilders with ${results.length} builders.`);
    setFilteredBuilders(results);
  }, [builders, searchQuery, statusFilter]);

  // Handler to clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return {
    filteredBuilders,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    handleClearFilters
  };
};
