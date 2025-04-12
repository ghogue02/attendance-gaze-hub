
// src/pages/Dashboard.tsx

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { StatisticsCards } from '@/components/dashboard/statistics';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import { useDashboardData } from '@/hooks/useDashboardData';
import { AttendanceNavigationState } from '@/hooks/attendance-capture/types';
import { deleteAttendanceRecordsByDate } from '@/services/attendanceHistoryService';
import { toast } from 'sonner';

const Dashboard = () => {
  const location = useLocation();
  const navigationState = location.state as AttendanceNavigationState | null;
  const initialTab = navigationState?.activeTab || 'builders';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [highlightBuilderId, setHighlightBuilderId] = useState<string | undefined>(
    navigationState?.highlightBuilderId
  );

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

  // Effect to update the tab when navigation state changes
  useEffect(() => {
    if (navigationState?.activeTab) {
      setActiveTab(navigationState.activeTab);
    }
    
    if (navigationState?.highlightBuilderId) {
      setHighlightBuilderId(navigationState.highlightBuilderId);
    }
  }, [navigationState]);

  // Clear highlight after some time (to avoid it persisting forever)
  useEffect(() => {
    if (highlightBuilderId) {
      const timer = setTimeout(() => {
        setHighlightBuilderId(undefined);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [highlightBuilderId]);

  // Delete attendance records for April 11, 2025 when the component loads
  useEffect(() => {
    // Check local storage to see if we've already run this operation
    const hasDeletedApril11 = localStorage.getItem('deleted_april11_2025_records');
    
    if (hasDeletedApril11) {
      console.log("April 11, 2025 records have already been deleted in a previous session");
      return;
    }
    
    const deleteApril11Records = async () => {
      try {
        console.log("Initiating deletion of attendance records for April 11, 2025");
        const result = await deleteAttendanceRecordsByDate("2025-04-11", (errorMessage) => {
          toast.error(errorMessage);
        });
        
        if (result) {
          toast.success("Successfully removed all attendance records from April 11, 2025");
          // Mark that we've completed this operation
          localStorage.setItem('deleted_april11_2025_records', 'true');
          // Refresh the dashboard data to reflect the changes
          refreshData(); 
        }
      } catch (error) {
        console.error("Failed to delete April 11, 2025 records:", error);
        toast.error("Failed to delete April 11, 2025 records");
      }
    };
    
    deleteApril11Records();
  }, [refreshData]);

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
          highlightBuilderId={highlightBuilderId}
        />
      </main>
    </div>
  );
};

export default Dashboard;
