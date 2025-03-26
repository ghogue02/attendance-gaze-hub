// src/pages/Dashboard.tsx

import { useState } from 'react';
import Header from '@/components/Header';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatisticsCards from '@/components/dashboard/StatisticsCards';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import { useDashboardData } from '@/hooks/useDashboardData'; // Import the hook

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('builders');

  // Use the central data hook
  const {
    builders, // Use this raw, merged data for stats and potentially analytics/history
    filteredBuilders, // Use this filtered data for the Builders list
    isLoading,
    searchQuery,
    statusFilter,
    selectedDate, // Get the display date from the hook
    setSearchQuery,
    setStatusFilter,
    handleMarkAttendance,
    handleClearFilters,
    refreshData // Get the manual refresh function
  } = useDashboardData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      <main className="pt-24 pb-16 px-4 container max-w-7xl mx-auto">
        {/* Pass selectedDate and refreshData to the header */}
        <DashboardHeader
          selectedDate={selectedDate}
          onRefresh={refreshData}
        />

        {/* Pass the raw 'builders' data to StatisticsCards */}
        <StatisticsCards builders={builders} />

        {/* Pass necessary state and handlers to Tabs */}
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          builders={builders} // Pass raw data for History/Analytics if needed
          filteredBuilders={filteredBuilders} // Pass filtered data for BuildersTab
          isLoading={isLoading}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          setSearchQuery={setSearchQuery}
          setStatusFilter={setStatusFilter}
          onClearFilters={handleClearFilters}
          onVerify={handleMarkAttendance} // Use handleMarkAttendance for verification
        />
      </main>
    </div>
  );
};

export default Dashboard;