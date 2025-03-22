
import { useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import UserProfileImage from './UserProfileImage';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from 'sonner';

interface DashboardHeaderProps {
  selectedDate: string;
  onRefresh: () => void;
}

const DashboardHeader = ({ selectedDate, onRefresh }: DashboardHeaderProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    
    // Reset the refreshing state after a moment
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleExport = () => {
    toast.success('Attendance report exported!', {
      description: 'The report has been downloaded to your device.'
    });
    
    // In a real implementation, this would generate and download a CSV or PDF file
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-8 mt-2">
      <div className="flex items-center mb-4 md:mb-0">
        <UserProfileImage 
          userName="Greg Hogue" 
          className="w-12 h-12 mr-4" 
          // Add the correct ID for Greg Hogue from the database
          userId="28bc877a-ba4a-4f73-bf58-90380a299b97"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center text-muted-foreground text-sm mt-1">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        <Button
          variant="outline"
          onClick={handleExport}
          className="hidden md:flex"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
        
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full md:w-auto"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
