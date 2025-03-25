
import { useState, useEffect } from 'react';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { getAllBuilders, markAttendance } from '@/utils/faceRecognition';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardData = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const [selectedDate] = useState(new Date().toLocaleDateString());

  useEffect(() => {
    loadBuilders();
    
    // Subscribe to attendance changes
    const attendanceChannel = supabase
      .channel('dashboard-attendance-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance' }, 
        () => {
          console.log('Attendance change detected, refreshing dashboard data');
          loadBuilders();
        }
      )
      .subscribe();
      
    // Subscribe to student profile changes  
    const profileChannel = supabase
      .channel('dashboard-profile-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'students' }, 
        () => {
          console.log('Student profile change detected, refreshing dashboard data');
          loadBuilders();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(profileChannel);
    };
  }, []);

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

  const loadBuilders = async () => {
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
  };

  const handleMarkAttendance = async (builderId: string, status: BuilderStatus, excuseReason?: string) => {
    try {
      const success = await markAttendance(builderId, status, excuseReason);
      
      if (success) {
        // Update local state
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
        
        // Force refresh to ensure data is up to date
        setTimeout(loadBuilders, 500);
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
