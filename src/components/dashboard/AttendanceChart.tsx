
import { useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { timeFrameOptions } from './constants/timeFrameOptions';
import { useAttendanceChartData } from '@/hooks/useAttendanceChartData';
import AttendanceBarChart from './AttendanceBarChart';

interface AttendanceChartProps {
  builders: Builder[];
  days?: number;
}

const AttendanceChart = ({ builders }: AttendanceChartProps) => {
  const [timeFrame, setTimeFrame] = useState("7");
  const days = parseInt(timeFrame);
  
  // Add debug output for timeFrame changes
  useEffect(() => {
    console.log(`AttendanceChart: timeFrame changed to ${timeFrame} (${days} days)`);
  }, [timeFrame, days]);
  
  const { chartData, isLoading } = useAttendanceChartData(builders, days);

  return (
    <div className="glass-card p-6 w-full h-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Attendance Trend</h3>
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
      <div className="h-[85%]">
        <AttendanceBarChart 
          chartData={chartData} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
};

export default AttendanceChart;
