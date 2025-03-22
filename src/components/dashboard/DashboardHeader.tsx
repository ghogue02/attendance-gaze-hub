
import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import UserProfileImage from './UserProfileImage';

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

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-8 mt-2">
      <div className="flex items-center mb-4 md:mb-0">
        <UserProfileImage className="w-12 h-12 mr-4" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center text-muted-foreground text-sm mt-1">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</span>
          </div>
        </div>
      </div>
      
      <Button
        variant="outline"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="w-full md:w-auto"
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
      </Button>
    </div>
  );
};

export default DashboardHeader;
