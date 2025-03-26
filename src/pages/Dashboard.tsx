
// src/pages/Dashboard.tsx

import { useState } from 'react';
import Header from '@/components/Header';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatisticsCards from '@/components/dashboard/StatisticsCards';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import { useDashboardData } from '@/hooks/useDashboardData';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('builders');

  // Destructure state and handlers from the custom hook
  const {
    builders,           // Use this for StatisticsCards and potentially Analytics/History
    filteredBuilders,   // Use this for the Builders list in BuildersTab
    isLoading,
    searchQuery,
    statusFilter,
    selectedDate,       // Pre-formatted date string
    setSearchQuery,
    setStatusFilter,
    handleMarkAttendance, // Function to update attendance status
    handleClearFilters, // Function to reset filters
    refreshData         // Function to manually refresh data
  } = useDashboardData();

  console.log(`[Dashboard Page] Rendering. isLoading: ${isLoading}, builders count: ${builders.length}, filtered count: ${filteredBuilders.length}`);
  console.log(`[Dashboard Page] Present count from builders state: ${builders.filter(b => b.status === 'present').length}`);


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      <main className="pt-24 pb-16 px-4 container max-w-7xl mx-auto">
        {/* Pass the refresh function and display date to the header */}
        <DashboardHeader
          selectedDate={selectedDate}
          onRefresh={refreshData} // Connect the refresh button
        />

        {/* Pass the raw 'builders' state (with merged status) to StatisticsCards */}
        <StatisticsCards builders={builders} />

        {/* Pass down all necessary props to the Tabs component */}
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          builders={builders}           // Pass raw data (needed by History/Analytics)
          filteredBuilders={filteredBuilders} // Pass filtered data (needed by BuildersTab)
          isLoading={isLoading}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          setSearchQuery={setSearchQuery}
          setStatusFilter={setStatusFilter}
          onClearFilters={handleClearFilters}
          onVerify={handleMarkAttendance} // Use the handler from the hook
          refreshData={refreshData}      // Pass the refresh function
        />
      </main>
    </div>
  );
};

export default Dashboard;
