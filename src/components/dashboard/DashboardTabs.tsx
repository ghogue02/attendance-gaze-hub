
import { memo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BuildersTab from './BuildersTab';
import HistoryTab from './HistoryTab';
import AnalyticsTab from './AnalyticsTab';
import { Builder, BuilderStatus } from '@/components/builder/types';

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  builders: Builder[];
  filteredBuilders: Builder[];
  isLoading: boolean;
  searchQuery: string;
  statusFilter: BuilderStatus | 'all';
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: BuilderStatus | 'all') => void;
  onClearFilters: () => void;
  onVerify: (builderId: string, status: BuilderStatus, reason?: string) => void;
}

const DashboardTabs = memo(({
  activeTab,
  setActiveTab,
  builders,
  filteredBuilders,
  isLoading,
  searchQuery,
  statusFilter,
  setSearchQuery,
  setStatusFilter,
  onClearFilters,
  onVerify
}: DashboardTabsProps) => {
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="mt-8"
    >
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="builders">Builders</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      
      <TabsContent value="builders" className={activeTab !== 'builders' ? 'hidden' : ''}>
        <BuildersTab 
          isLoading={isLoading}
          filteredBuilders={filteredBuilders}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          setSearchQuery={setSearchQuery}
          setStatusFilter={setStatusFilter}
          onClearFilters={onClearFilters}
          onVerify={onVerify}
        />
      </TabsContent>
      
      <TabsContent value="history" className={activeTab !== 'history' ? 'hidden' : ''}>
        <HistoryTab 
          builders={builders} 
        />
      </TabsContent>
      
      <TabsContent value="analytics" className={activeTab !== 'analytics' ? 'hidden' : ''}>
        <AnalyticsTab 
          builders={builders} 
        />
      </TabsContent>
    </Tabs>
  );
});

DashboardTabs.displayName = 'DashboardTabs';

export default DashboardTabs;
