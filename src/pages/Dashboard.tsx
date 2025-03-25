
import { useState } from 'react';
import Header from '@/components/Header';
import { useDashboardData } from '@/hooks/useDashboardData';

// Import components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatisticsCards from '@/components/dashboard/StatisticsCards';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

const Dashboard = () => {
  const {
    builders,
    filteredBuilders,
    isLoading,
    searchQuery,
    statusFilter,
    selectedDate,
    setSearchQuery,
    setStatusFilter,
    handleMarkAttendance,
    handleClearFilters,
    loadBuilders
  } = useDashboardData();
  
  const [activeTab, setActiveTab] = useState<string>("builders");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Header />
      
      <main className="pt-24 pb-16 px-4 container max-w-6xl mx-auto">
        <DashboardHeader 
          selectedDate={selectedDate} 
          onRefresh={loadBuilders} 
        />
        
        <StatisticsCards builders={builders} />
        
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          builders={builders}
          filteredBuilders={filteredBuilders}
          isLoading={isLoading}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          setSearchQuery={setSearchQuery}
          setStatusFilter={setStatusFilter}
          onClearFilters={handleClearFilters}
          onVerify={handleMarkAttendance}
        />
      </main>
    </div>
  );
};

export default Dashboard;
