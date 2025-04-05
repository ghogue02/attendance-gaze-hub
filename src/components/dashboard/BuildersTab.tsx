
import { useState } from 'react';
import { BuilderStatus } from '@/components/builder/types';
import BuilderFilters from './BuilderFilters';
import { AddBuilderDialog } from '@/components/builder/AddBuilderDialog';
import { DeleteBuilderDialog } from '@/components/builder/DeleteBuilderDialog';
import BuildersHeader from './builders/BuildersHeader';
import SortedBuildersList from './builders/SortedBuildersList';

interface BuildersTabProps {
  isLoading: boolean;
  filteredBuilders: any[];
  searchQuery: string;
  statusFilter: BuilderStatus | 'all';
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: BuilderStatus | 'all') => void;
  onClearFilters: () => void;
  onVerify: (builderId: string, status: BuilderStatus, reason?: string) => void;
  refreshData: () => void;
}

const BuildersTab = ({
  isLoading,
  filteredBuilders,
  searchQuery,
  statusFilter,
  setSearchQuery,
  setStatusFilter,
  onClearFilters,
  onVerify,
  refreshData
}: BuildersTabProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [builderToDelete, setBuilderToDelete] = useState<{ id: string, name: string } | null>(null);
  const [sortOption, setSortOption] = useState('name');
  
  const handleDeleteRequest = (builderId: string, builderName: string) => {
    setBuilderToDelete({ id: builderId, name: builderName });
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <BuildersHeader onAddBuilderClick={() => setIsAddDialogOpen(true)} />
      
      <BuilderFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />
      
      <SortedBuildersList
        isLoading={isLoading}
        filteredBuilders={filteredBuilders}
        searchQuery={searchQuery}
        sortOption={sortOption}
        onClearFilters={onClearFilters}
        onVerify={onVerify}
        onDeleteRequest={handleDeleteRequest}
      />
      
      <AddBuilderDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onBuilderAdded={refreshData}
      />
      
      <DeleteBuilderDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        builder={builderToDelete}
        onBuilderDeleted={refreshData}
      />
    </div>
  );
};

export default BuildersTab;
