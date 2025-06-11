
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AttendanceBarChart from './AttendanceBarChart';
import AttendancePieChart from './AttendancePieChart';
import { useAttendanceChartData } from '@/hooks/useAttendanceChartData';
import { Builder } from '@/components/builder/types';
import { useCohortSelection } from '@/hooks/useCohortSelection';

interface AttendanceChartProps {
  builders: Builder[];
}

const AttendanceChart = ({ builders }: AttendanceChartProps) => {
  const [timeFrame, setTimeFrame] = useState<string>('7');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const { selectedCohort } = useCohortSelection();
  
  const days = parseInt(timeFrame);
  const cohortFilter = selectedCohort === 'All Cohorts' ? undefined : selectedCohort;
  const { chartData, isLoading } = useAttendanceChartData(builders, days, cohortFilter);

  const timeFrameOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '14', label: 'Last 14 days' },
    { value: '30', label: 'Last 30 days' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Attendance Analytics</CardTitle>
            <CardDescription>
              {selectedCohort !== 'All Cohorts' && `${selectedCohort} - `}
              Attendance trends over time
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeFrameOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={chartType} onValueChange={(value: 'bar' | 'pie') => setChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : chartType === 'bar' ? (
          <AttendanceBarChart data={chartData} />
        ) : (
          <AttendancePieChart data={chartData} />
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceChart;
