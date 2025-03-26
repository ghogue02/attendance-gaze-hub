
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { BuilderStatus } from '@/components/builder/types';
import { Button } from '@/components/ui/button';
import BuilderFilters from './BuilderFilters';
import BuildersList from './BuildersList';
import { AddBuilderDialog } from '@/components/builder/AddBuilderDialog';
import { DeleteBuilderDialog } from '@/components/builder/DeleteBuilderDialog';

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

  const handleDeleteRequest = (builderId: string, builderName: string) => {
    setBuilderToDelete({ id: builderId, name: builderName });
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Builders</h2>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add Builder
        </Button>
      </div>
      
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
