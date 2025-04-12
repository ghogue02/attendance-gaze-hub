
import { useState, useEffect, useRef } from 'react';
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
  highlightBuilderId?: string;
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
  refreshData,
  highlightBuilderId
}: BuildersTabProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [builderToDelete, setBuilderToDelete] = useState<{ id: string, name: string } | null>(null);
  const [sortOption, setSortOption] = useState('name');
  const highlightedBuilderRef = useRef<HTMLDivElement>(null);
  
  const handleDeleteRequest = (builderId: string, builderName: string) => {
    setBuilderToDelete({ id: builderId, name: builderName });
    setIsDeleteDialogOpen(true);
  };

  // Effect to scroll to the highlighted builder
  useEffect(() => {
    if (highlightBuilderId && highlightedBuilderRef.current) {
      // Smooth scroll to the highlighted builder
      highlightedBuilderRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlightBuilderId, filteredBuilders]);

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
        builders={filteredBuilders} // Pass filteredBuilders as the builders prop
        isLoading={isLoading}
        filteredBuilders={filteredBuilders}
        searchQuery={searchQuery}
        sortOption={sortOption}
        onClearFilters={onClearFilters}
        onVerify={onVerify}
        onDeleteRequest={handleDeleteRequest}
        highlightBuilderId={highlightBuilderId}
        highlightedBuilderRef={highlightedBuilderRef}
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
