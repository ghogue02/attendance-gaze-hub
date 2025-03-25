
import { BuilderStatus } from '@/components/builder/types';
import BuilderFilters from './BuilderFilters';
import BuildersList from './BuildersList';

interface BuildersTabProps {
  isLoading: boolean;
  filteredBuilders: any[];
  searchQuery: string;
  statusFilter: BuilderStatus | 'all';
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: BuilderStatus | 'all') => void;
  onClearFilters: () => void;
  onVerify: (builderId: string, status: BuilderStatus, reason?: string) => void;
}

const BuildersTab = ({
  isLoading,
  filteredBuilders,
  searchQuery,
  statusFilter,
  setSearchQuery,
  setStatusFilter,
  onClearFilters,
  onVerify
}: BuildersTabProps) => {
  return (
    <div className="space-y-6">
      <BuilderFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      
      <BuildersList 
        isLoading={isLoading}
        filteredBuilders={filteredBuilders}
        searchQuery={searchQuery}
        onClearFilters={onClearFilters}
        onVerify={onVerify}
      />
    </div>
  );
};

export default BuildersTab;
