// src/components/dashboard/DashboardHeader.tsx

import { useState } from 'react';
import { Calendar, Download, RefreshCw } from 'lucide-react'; // Import RefreshCw
import { Button } from '@/components/ui/button';
// Removed date-fns format as selectedDate is now pre-formatted string
// import { format } from 'date-fns';
import UserProfileImage from './UserProfileImage';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from 'sonner';

interface DashboardHeaderProps {
  selectedDate: string; // Expecting a pre-formatted string now
  onRefresh: () => void; // Function to call when refresh is clicked
}

const DashboardHeader = ({ selectedDate, onRefresh }: DashboardHeaderProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    if (isRefreshing) return; // Prevent multiple clicks

    setIsRefreshing(true);
    console.log('[DashboardHeader] Refresh button clicked');
    onRefresh(); // Call the function passed from the parent (which triggers loadData)

    // Simulate refresh duration - remove this if loadData handles its own loading state feedback well
    // Or adjust timeout based on typical load time
    setTimeout(() => {
      setIsRefreshing(false);
      console.log('[DashboardHeader] Refresh state reset');
    }, 1500); // Reset after 1.5 seconds
  };

  const handleExport = () => {
    toast.success('Attendance report exported!', {
      description: 'The report has been downloaded to your device.'
    });
    // Add actual export logic here later
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-8 mt-2">
      <div className="flex items-center mb-4 md:mb-0">
        <UserProfileImage
          userName="Greg Hogue"
          className="w-12 h-12 mr-4"
          userId="28bc877a-ba4a-4f73-bf58-90380a299b97" // Ensure this ID is correct
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center text-muted-foreground text-sm mt-1">
            <Calendar className="h-4 w-4 mr-1.5" />
            {/* Display the pre-formatted date string */}
            <span>{selectedDate}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        <ThemeToggle />

        <Button
          variant="outline"
          onClick={handleExport}
          className="hidden md:inline-flex" // Use inline-flex for button content alignment
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>

        {/* Refresh Button */}
        <Button
          variant="outline"
          onClick={handleRefreshClick} // Use the dedicated handler
          disabled={isRefreshing}
          className="w-auto" // Let button size naturally
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;