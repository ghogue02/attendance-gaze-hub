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
import { isClassDay, isCancelledClassDay } from '@/utils/attendance/isClassDay';
import { AdminButton } from '@/components/admin/AdminButton';

const Dashboard = () => {
  const location = useLocation();
  const navigationState = location.state as AttendanceNavigationState | null;
  const initialTab = navigationState?.activeTab || 'builders';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [highlightBuilderId, setHighlightBuilderId] = useState<string | undefined>(
    navigationState?.highlightBuilderId
  );
  const processingRef = useRef(false);

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

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!isClassDay(today)) {
      console.log(`Today (${today}) is not a regular class day. This is expected. Viewing is still enabled.`);
    } else if (isCancelledClassDay(today)) {
      console.log(`Today (${today}) is a cancelled class day. Attendance may not be required, but viewing is enabled.`);
    }
  }, []);

  useEffect(() => {
    if (navigationState?.activeTab) {
      setActiveTab(navigationState.activeTab);
    }
    
    if (navigationState?.highlightBuilderId) {
      setHighlightBuilderId(navigationState.highlightBuilderId);
    }
  }, [navigationState]);

  useEffect(() => {
    if (highlightBuilderId) {
      const timer = setTimeout(() => {
        setHighlightBuilderId(undefined);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [highlightBuilderId]);

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

  useEffect(() => {
    const deleteProblematicDates = async () => {
      if (processingRef.current) return;
      processingRef.current = true;
      
      try {
        await processSpecificDateIssues();
        
        const dates = [
          { date: '2025-04-20', storageKey: 'deleted_april20_2025_records', description: 'Sunday (Holiday)' },
          { date: '2025-04-11', storageKey: 'deleted_april11_2025_records', description: 'Friday' },
          { date: '2025-04-04', storageKey: 'deleted_april04_2025_records', description: 'Friday' }
        ];
        
        for (const { date, storageKey, description } of dates) {
          const maxAttempts = 3;
          const attemptsKey = `${date.replace(/-/g, '')}_deletion_attempts`;
          const attemptsMade = parseInt(localStorage.getItem(attemptsKey) || '0', 10);
          
          if (localStorage.getItem(storageKey) || attemptsMade >= maxAttempts) {
            console.log(`Skipping deletion for ${date} (${description}) - already processed or max attempts reached`);
            continue;
          }
          
          try {
            console.log(`Initiating deletion of attendance records for ${date} (${description})`);
            localStorage.setItem(attemptsKey, (attemptsMade + 1).toString());
            
            const result = await deleteAttendanceRecordsByDate(date, (errorMessage) => {
              toast.error(errorMessage);
            });
            
            if (result) {
              toast.success(`Successfully removed all attendance records from ${date} (${description})`);
              localStorage.setItem(storageKey, 'true');
              refreshData();
              continue;
            }
            
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
        <div className="flex justify-between items-start mb-4">
          <DashboardHeader
            selectedDate={selectedDate}
            onRefresh={refreshData}
          />
          <AdminButton />
        </div>

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
          refreshData={refreshData}
          highlightBuilderId={highlightBuilderId}
        />
      </main>
    </div>
  );
};

export default Dashboard;
