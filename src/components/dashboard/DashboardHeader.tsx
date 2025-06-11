
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CohortSelector from './CohortSelector';
import { CohortName } from '@/types/cohort';

interface DashboardHeaderProps {
  selectedCohort: CohortName;
  onCohortChange: (cohort: CohortName) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const DashboardHeader = ({ 
  selectedCohort, 
  onCohortChange, 
  onRefresh, 
  isRefreshing 
}: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Manage attendance and view analytics</p>
      </div>
      
      <div className="flex items-center gap-4">
        <CohortSelector
          selectedCohort={selectedCohort}
          onCohortChange={onCohortChange}
        />
        
        <Button 
          onClick={onRefresh} 
          disabled={isRefreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
