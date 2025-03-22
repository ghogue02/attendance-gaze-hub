
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Builder, BuilderStatus } from '@/components/BuilderCard';
import { getAllBuilders, markAttendance } from '@/utils/faceRecognition';
import { toast } from 'sonner';

// Import new components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatisticsCards from '@/components/dashboard/StatisticsCards';
import BuilderFilters from '@/components/dashboard/BuilderFilters';
import BuildersList from '@/components/dashboard/BuildersList';

const Dashboard = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString());

  useEffect(() => {
    loadBuilders();
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

  const handleMarkAttendance = async (builderId: string) => {
    try {
      // Find the current builder's status to toggle it
      const builder = builders.find(s => s.id === builderId);
      if (!builder) return;
      
      const newStatus: 'present' | 'absent' = builder.status === 'present' ? 'absent' : 'present';
      const success = await markAttendance(builderId, newStatus);
      
      if (success) {
        // Update local state
        setBuilders(prevBuilders => 
          prevBuilders.map(builder => 
            builder.id === builderId
              ? { 
                  ...builder, 
                  status: newStatus,
                  timeRecorded: new Date().toLocaleTimeString() 
                }
              : builder
          )
        );
        
        toast.success(`Attendance marked as ${newStatus}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Header />
      
      <main className="pt-24 pb-16 px-4 container max-w-6xl mx-auto">
        <DashboardHeader 
          selectedDate={selectedDate} 
          onRefresh={loadBuilders} 
        />
        
        <StatisticsCards builders={builders} />
        
        <BuilderFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        
        <BuildersList 
          isLoading={isLoading}
          filteredBuilders={filteredBuilders}
          searchQuery={searchQuery}
          onClearFilters={handleClearFilters}
          onVerify={handleMarkAttendance}
        />
      </main>
    </div>
  );
};

export default Dashboard;
