
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatisticsCards from '@/components/dashboard/statistics/StatisticsCards';
import BuildersTab from '@/components/dashboard/BuildersTab';
import AnalyticsTab from '@/components/dashboard/AnalyticsTab';
import HistoryTab from '@/components/dashboard/HistoryTab';
import ArchivedTab from '@/components/dashboard/ArchivedTab';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useCohortSelection } from '@/hooks/useCohortSelection';
import AttendanceLoadingState from '@/components/dashboard/AttendanceLoadingState';

const Dashboard = () => {
  const { builders, isLoading, error, refresh } = useDashboardData();
  const { selectedCohort, setSelectedCohort } = useCohortSelection();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader
          selectedCohort={selectedCohort}
          onCohortChange={setSelectedCohort}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive font-medium">Error: {error}</p>
          </div>
        )}
        
        <StatisticsCards builders={builders} />
        
        <Tabs defaultValue="builders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="builders">Builders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          
          <TabsContent value="builders">
            {isLoading ? (
              <AttendanceLoadingState />
            ) : (
              <BuildersTab builders={builders} />
            )}
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsTab builders={builders} />
          </TabsContent>
          
          <TabsContent value="history">
            <HistoryTab builders={builders} />
          </TabsContent>
          
          <TabsContent value="archived">
            <ArchivedTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
