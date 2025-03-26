
import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { BuilderStatus } from '@/components/builder/types';
import { Button } from '@/components/ui/button';
import BuilderFilters from './BuilderFilters';
import BuildersList from './BuildersList';
import { AddBuilderDialog } from '@/components/builder/AddBuilderDialog';
import { DeleteBuilderDialog } from '@/components/builder/DeleteBuilderDialog';
import { supabase } from '@/integrations/supabase/client';

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
  const [sortedBuilders, setSortedBuilders] = useState(filteredBuilders);
  const [builderAttendanceRates, setBuilderAttendanceRates] = useState<{[key: string]: number | null}>({});
  
  // Fetch attendance rates for all builders
  useEffect(() => {
    const fetchAttendanceRates = async () => {
      if (filteredBuilders.length === 0) return;
      
      const rates: {[key: string]: number | null} = {};
      
      for (const builder of filteredBuilders) {
        try {
          const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', builder.id);

          if (error) {
            console.error('Error fetching attendance:', error);
            rates[builder.id] = null;
            continue;
          }

          if (data.length === 0) {
            rates[builder.id] = null;
            continue;
          }

          // Filter out Fridays
          const nonFridayRecords = data.filter(record => {
            const date = new Date(record.date);
            return date.getDay() !== 5; // 5 is Friday
          });

          if (nonFridayRecords.length === 0) {
            rates[builder.id] = null;
            continue;
          }

          // Count present or late days
          const presentCount = nonFridayRecords.filter(
            record => record.status === 'present' || record.status === 'late'
          ).length;

          // Calculate rate
          rates[builder.id] = Math.round((presentCount / nonFridayRecords.length) * 100);
        } catch (error) {
          console.error('Error calculating attendance rate:', error);
          rates[builder.id] = null;
        }
      }
      
      setBuilderAttendanceRates(rates);
    };

    fetchAttendanceRates();
  }, [filteredBuilders]);

  // Sort the builders based on the selected option
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
        // Default to name sorting
        builders.sort((a, b) => a.name.localeCompare(b.name));
    }

    setSortedBuilders(builders);
  }, [filteredBuilders, sortOption, builderAttendanceRates]);

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
        sortOption={sortOption}
        setSortOption={setSortOption}
      />
      
      <BuildersList 
        isLoading={isLoading}
        filteredBuilders={sortedBuilders}
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
