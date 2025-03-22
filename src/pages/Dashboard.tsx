
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Builder, BuilderStatus } from '@/components/BuilderCard';
import { getAllBuilders, markAttendance } from '@/utils/faceRecognition';
import { toast } from 'sonner';

// Import components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatisticsCards from '@/components/dashboard/StatisticsCards';
import BuilderFilters from '@/components/dashboard/BuilderFilters';
import BuildersList from '@/components/dashboard/BuildersList';
import AttendanceChart from '@/components/dashboard/AttendanceChart';
import AttendancePieChart from '@/components/dashboard/AttendancePieChart';
import AttendanceHistory from '@/components/dashboard/AttendanceHistory';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Dashboard = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BuilderStatus | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString());
  const [activeTab, setActiveTab] = useState<string>("builders");

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
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mt-8"
        >
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="builders">Builders</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="builders" className="space-y-6">
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
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <AttendanceHistory builders={builders} />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceChart builders={builders} />
              <AttendancePieChart builders={builders} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
