
import { useState, useEffect, useCallback } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { getAllBuilders } from '@/utils/faceRecognition';
// Import markAttendance directly from attendance utils to avoid ambiguity
import { markAttendance } from '@/utils/attendance/markAttendance';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardData = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const [selectedDate] = useState(new Date().toLocaleDateString());

  // Memoize the loadBuilders function to prevent infinite loops
  const loadBuilders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllBuilders();
      console.log('Loaded builders:', data);
      setBuilders(data);
      setFilteredBuilders(data);
    } catch (error) {
      console.error('Error loading builders:', error);
      toast.error('Failed to load builder data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBuilders();
    
    // Subscribe to attendance changes with improved handling
    const attendanceChannel = supabase
      .channel('dashboard-attendance-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance' }, 
        (payload) => {
          console.log('Attendance change detected:', payload);
          // Force immediate refresh when attendance changes
          loadBuilders();
        }
      )
      .subscribe((status) => {
        console.log('Attendance subscription status:', status);
      });
      
    // Subscribe to student profile changes with improved handling
    const profileChannel = supabase
      .channel('dashboard-profile-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'students' }, 
        (payload) => {
          console.log('Student profile change detected:', payload);
          // Force immediate refresh when profiles change
          loadBuilders();
        }
      )
      .subscribe((status) => {
        console.log('Profile subscription status:', status);
      });
    
    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [loadBuilders]);

  useEffect(() => {
    // Apply filters when builders, search query, or status filter changes
    let results = [...builders];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(builder => 
        builder.name.toLowerCase().includes(query) || 
        builder.builderId.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== 'all') {
      results = results.filter(builder => builder.status === statusFilter);
    }
    
    setFilteredBuilders(results);
  }, [builders, searchQuery, statusFilter]);

  const handleMarkAttendance = async (builderId: string, status: BuilderStatus, excuseReason?: string) => {
    try {
      // Pass only the required parameters to markAttendance
      const success = await markAttendance(builderId, status, excuseReason);
      
      if (success) {
        // Update local state immediately
        setBuilders(prevBuilders => 
          prevBuilders.map(builder => 
            builder.id === builderId
              ? { 
                  ...builder, 
                  status,
                  excuseReason: status === 'excused' ? excuseReason : undefined,
                  timeRecorded: new Date().toLocaleTimeString() 
                }
              : builder
          )
        );
        
        const statusText = status === 'excused' ? 'Excused absence' : `Attendance marked as ${status}`;
        toast.success(statusText);
        
        // Force reload after a short delay to ensure data is up to date
        setTimeout(loadBuilders, 300);
      } else {
        toast.error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('An error occurred while updating attendance');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return {
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
  };
};
