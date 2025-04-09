
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BuildersTab from './BuildersTab';
import HistoryTab from './HistoryTab';
import AnalyticsTab from './AnalyticsTab';
import { Builder, BuilderStatus } from '@/components/builder/types';

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  builders: Builder[];
  filteredBuilders: Builder[];
  isLoading: boolean;
  searchQuery: string;
  statusFilter: BuilderStatus | 'all';
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: BuilderStatus | 'all') => void;
  onClearFilters: () => void;
  onVerify: (builderId: string, status: BuilderStatus, reason?: string) => void;
  refreshData: () => void;
  highlightBuilderId?: string;
}

const DashboardTabs = ({
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
  onVerify,
  refreshData,
  highlightBuilderId
}: DashboardTabsProps) => {
  // Track tab changes
  const [previousTab, setPreviousTab] = useState(activeTab);

  // Effect to refresh data when switching back to builders tab
  useEffect(() => {
    if (activeTab !== previousTab) {
      // Refresh only when switching to and not away from the builders tab
      if (activeTab === 'builders') {
        // Add slight delay to avoid UI jank
        const timer = setTimeout(() => {
          refreshData();
        }, 100);
        
        return () => clearTimeout(timer);
      }
      
      setPreviousTab(activeTab);
    }
  }, [activeTab, previousTab, refreshData]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
      <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8">
        <TabsTrigger value="builders">Builders</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      
      <TabsContent value="builders">
        <BuildersTab
          isLoading={isLoading}
          filteredBuilders={filteredBuilders}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          setSearchQuery={setSearchQuery}
          setStatusFilter={setStatusFilter}
          onClearFilters={onClearFilters}
          onVerify={onVerify}
          refreshData={refreshData}
          highlightBuilderId={highlightBuilderId}
        />
      </TabsContent>
      
      <TabsContent value="history">
        <HistoryTab builders={builders} />
      </TabsContent>
      
      <TabsContent value="analytics">
        <AnalyticsTab builders={builders} />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;
