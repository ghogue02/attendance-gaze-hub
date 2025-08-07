
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatisticsCards from '@/components/dashboard/statistics/StatisticsCards';
import BuildersTabWrapper from '@/components/dashboard/BuildersTabWrapper';
import AnalyticsTab from '@/components/dashboard/AnalyticsTab';
import HistoryTab from '@/components/dashboard/HistoryTab';
import ArchivedTab from '@/components/dashboard/ArchivedTab';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useCohortSelection } from '@/hooks/useCohortSelection';
import AttendanceLoadingState from '@/components/dashboard/AttendanceLoadingState';
import { markAttendance } from '@/utils/attendance/markAttendance';
import { BuilderStatus } from '@/components/builder/types';
import { toast } from 'sonner';

const Dashboard = () => {
  const { builders, isLoading, error, refresh } = useDashboardData();
  const { selectedCohort, setSelectedCohort } = useCohortSelection();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter builders by selected cohort
  const filteredBuilders = useMemo(() => {
    if (selectedCohort === 'All Cohorts') {
      return builders;
    }
    return builders.filter(builder => builder.cohort === selectedCohort);
  }, [builders, selectedCohort]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleVerify = async (builderId: string, status: BuilderStatus, reason?: string) => {
    try {
      console.log('Dashboard: Marking attendance for builder:', builderId, 'with status:', status, 'reason:', reason);
      
      const success = await markAttendance(builderId, status, reason);
      
      if (success) {
        toast.success(`Successfully marked as ${status}${reason ? ` with reason: ${reason}` : ''}`);
        // Refresh the data to show the updated status
        await refresh();
      } else {
        toast.error('Failed to mark attendance. Please try again.');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('An error occurred while marking attendance.');
    }
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
        
        <StatisticsCards builders={filteredBuilders} />
        
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
              <BuildersTabWrapper 
                builders={filteredBuilders}
                isLoading={isLoading}
                onVerify={handleVerify}
                refreshData={refresh}
              />
            )}
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsTab builders={filteredBuilders} />
          </TabsContent>
          
          <TabsContent value="history">
            <HistoryTab builders={filteredBuilders} selectedCohort={selectedCohort} />
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
