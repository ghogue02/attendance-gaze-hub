
import { useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { timeFrameOptions } from './constants/timeFrameOptions';
import { useAttendanceChartData } from '@/hooks/useAttendanceChartData';
import AttendanceBarChart from './AttendanceBarChart';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { markPendingAsAbsent } from '@/services/attendanceService';
import { toast } from 'sonner';

interface AttendanceChartProps {
  builders: Builder[];
  days?: number;
}

const AttendanceChart = ({ builders }: AttendanceChartProps) => {
  const [timeFrame, setTimeFrame] = useState("7");
  const [refreshing, setRefreshing] = useState(false);
  const days = parseInt(timeFrame);
  
  // Add debug output for timeFrame changes
  useEffect(() => {
    console.log(`AttendanceChart: timeFrame changed to ${timeFrame} (${days} days)`);
  }, [timeFrame, days]);
  
  const { chartData, isLoading } = useAttendanceChartData(builders, days);

  const handleRefreshChart = async () => {
    setRefreshing(true);
    try {
      // Get the dates from the chart data
      const dates = chartData.map(data => data.date);
      
      let totalUpdated = 0;
      
      // Process each date
      for (const date of dates) {
        const updated = await markPendingAsAbsent(date);
        if (updated > 0) {
          totalUpdated += updated;
        }
      }
      
      if (totalUpdated > 0) {
        toast.success(`Updated ${totalUpdated} attendance records`);
        // Force reload the page to refresh all data
        window.location.reload();
      } else {
        toast.info("No records needed updating");
      }
    } catch (error) {
      console.error('Error refreshing chart data:', error);
      toast.error('Failed to refresh chart data');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="glass-card p-6 w-full h-[500px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Attendance Trend</h3>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefreshChart} 
            disabled={refreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              {timeFrameOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-[90%]">
        <AttendanceBarChart 
          chartData={chartData} 
          isLoading={isLoading || refreshing} 
        />
      </div>
    </div>
  );
};

export default AttendanceChart;
