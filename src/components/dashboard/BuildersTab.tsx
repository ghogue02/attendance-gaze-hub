
import { useState, useEffect, useRef } from 'react';
import { BuilderStatus } from '@/components/builder/types';
import BuilderFilters from './BuilderFilters';
import { AddBuilderDialog } from '@/components/builder/AddBuilderDialog';
import { ArchiveBuilderDialog } from '@/components/builder/ArchiveBuilderDialog';
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
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [builderToArchive, setBuilderToArchive] = useState<{ id: string, name: string } | null>(null);
  const [sortOption, setSortOption] = useState('name');
  const highlightedBuilderRef = useRef<HTMLDivElement>(null);
  
  const handleArchiveRequest = (builderId: string, builderName: string) => {
    setBuilderToArchive({ id: builderId, name: builderName });
    setIsArchiveDialogOpen(true);
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

  // Log the current sort option when it changes
  useEffect(() => {
    console.log(`[BuildersTab] Sort option changed to: ${sortOption}`);
  }, [sortOption]);

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
        builders={filteredBuilders}
        isLoading={isLoading}
        filteredBuilders={filteredBuilders}
        searchQuery={searchQuery}
        sortOption={sortOption}
        onClearFilters={onClearFilters}
        onVerify={onVerify}
        onDeleteRequest={handleArchiveRequest}
        highlightBuilderId={highlightBuilderId}
        highlightedBuilderRef={highlightedBuilderRef}
      />
      
      <AddBuilderDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onBuilderAdded={refreshData}
      />
      
      <ArchiveBuilderDialog
        open={isArchiveDialogOpen}
        onOpenChange={setIsArchiveDialogOpen}
        builder={builderToArchive}
        onBuilderArchived={refreshData}
      />
    </div>
  );
};

export default BuildersTab;
