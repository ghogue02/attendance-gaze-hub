
// src/pages/Dashboard.tsx

import { useState, useEffect, useRef } from 'react';
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
import { processSpecificDateIssues } from '@/services/attendance/historicalDates';

const Dashboard = () => {
  const location = useLocation();
  const navigationState = location.state as AttendanceNavigationState | null;
  const initialTab = navigationState?.activeTab || 'builders';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [highlightBuilderId, setHighlightBuilderId] = useState<string | undefined>(
    navigationState?.highlightBuilderId
  );
  const processingRef = useRef(false);

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
      console.log(`Attempting to force delete attendance records for ${dateString} via Edge Function...`);
      const response = await supabase.functions.invoke('index', {
        body: { 
          name: 'force_delete_attendance_by_date',
          params: { target_date: dateString } 
        }
      });
      
      if (response.error) {
        console.error('Edge function error:', response.error);
        return false;
      }
      
      console.log('Edge function response:', response.data);
      return true;
    } catch (error) {
      console.error('Force delete error:', error);
      return false;
    }
  };

  // Delete attendance records for problematic dates when the component loads
  useEffect(() => {
    const deleteProblematicDates = async () => {
      if (processingRef.current) return;
      processingRef.current = true;
      
      try {
        // Process specific date issues first
        await processSpecificDateIssues();
        
        // Now handle problematic dates (Fridays and Sundays)
        const dates = [
          { date: '2025-04-20', storageKey: 'deleted_april20_2025_records', description: 'Sunday (Holiday)' },
          { date: '2025-04-11', storageKey: 'deleted_april11_2025_records', description: 'Friday' },
          { date: '2025-04-04', storageKey: 'deleted_april04_2025_records', description: 'Friday' }
        ];
        
        for (const { date, storageKey, description } of dates) {
          // Track deletion attempts to prevent infinite loops
          const maxAttempts = 3;
          const attemptsKey = `${date.replace(/-/g, '')}_deletion_attempts`;
          const attemptsMade = parseInt(localStorage.getItem(attemptsKey) || '0', 10);
          
          // Skip if we've already deleted this date's records or made max attempts
          if (localStorage.getItem(storageKey) || attemptsMade >= maxAttempts) {
            console.log(`Skipping deletion for ${date} (${description}) - already processed or max attempts reached`);
            continue;
          }
          
          try {
            console.log(`Initiating deletion of attendance records for ${date} (${description})`);
            localStorage.setItem(attemptsKey, (attemptsMade + 1).toString());
            
            // First try with standard delete
            const result = await deleteAttendanceRecordsByDate(date, (errorMessage) => {
              toast.error(errorMessage);
            });
            
            if (result) {
              toast.success(`Successfully removed all attendance records from ${date} (${description})`);
              localStorage.setItem(storageKey, 'true');
              refreshData();
              continue;
            }
            
            // If standard delete failed, try with direct SQL approach
            console.log(`Standard delete failed for ${date}, attempting force delete via Edge Function`);
            const forceResult = await forceDeleteRecords(date);
            
            if (forceResult) {
              toast.success(`Successfully force-deleted all records from ${date} (${description})`);
              localStorage.setItem(storageKey, 'true');
              refreshData();
            } else {
              toast.error(`Failed to delete ${date} records even with force method`);
            }
          } catch (error) {
            console.error(`Failed to delete ${date} records:`, error);
            toast.error(`Failed to delete ${date} records`);
          }
        }
      } finally {
        processingRef.current = false;
      }
    };
    
    deleteProblematicDates();
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
