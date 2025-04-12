
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
import { supabase } from '@/integrations/supabase/client';

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
    refreshData         
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

  // Function to force delete records using direct SQL if necessary
  const forceDeleteRecords = async (dateString: string) => {
    try {
      const { error } = await supabase.rpc('force_delete_attendance_by_date', {
        target_date: dateString
      });
      
      if (error) {
        console.error('RPC error:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Force delete error:', error);
      return false;
    }
  };

  // Delete attendance records for April 11, 2025 when the component loads
  useEffect(() => {
    // Track deletion attempts to prevent infinite loops
    const maxAttempts = 3;
    const attemptsKey = 'april11_deletion_attempts';
    const attemptsMade = parseInt(localStorage.getItem(attemptsKey) || '0', 10);
    
    if (attemptsMade >= maxAttempts) {
      console.log("Maximum deletion attempts reached for April 11 records");
      return;
    }
    
    const deleteApril11Records = async () => {
      try {
        console.log("Initiating deletion of attendance records for April 11, 2025");
        localStorage.setItem(attemptsKey, (attemptsMade + 1).toString());
        
        // First try with standard delete
        const result = await deleteAttendanceRecordsByDate("2025-04-11", (errorMessage) => {
          toast.error(errorMessage);
        });
        
        if (result) {
          toast.success("Successfully removed all attendance records from April 11, 2025");
          // Mark that we've completed this operation
          localStorage.setItem('deleted_april11_2025_records', 'true');
          // Refresh the dashboard data to reflect the changes
          refreshData();
          return;
        }
        
        // If standard delete failed, try with direct SQL approach
        console.log("Standard delete failed, attempting force delete via RPC");
        const forceResult = await forceDeleteRecords("2025-04-11");
        
        if (forceResult) {
          toast.success("Successfully force-deleted all records from April 11, 2025");
          localStorage.setItem('deleted_april11_2025_records', 'true');
          refreshData();
        } else {
          toast.error("Failed to delete April 11, 2025 records even with force method");
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
