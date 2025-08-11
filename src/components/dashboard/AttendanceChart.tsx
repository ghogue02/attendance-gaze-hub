
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Builder } from '@/components/builder/types';
import { useCohortSelection } from '@/hooks/useCohortSelection';
import { useSimpleAttendanceAnalytics } from '@/hooks/useSimpleAttendanceAnalytics';
import SimpleBarChart from '@/components/analytics/SimpleBarChart';
import SimplePieChart from '@/components/analytics/SimplePieChart';

interface AttendanceChartProps {
  builders: Builder[];
}

const AttendanceChart = ({ builders }: AttendanceChartProps) => {
  const [timeFrame, setTimeFrame] = useState<string>('30');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const { selectedCohort } = useCohortSelection();
  
  const days = parseInt(timeFrame);
  
  // Memoize filtered builders to prevent unnecessary re-renders
  const filteredBuilders = useMemo(() => {
    if (selectedCohort === 'All Cohorts') {
      return builders;
    }
    return builders.filter(builder => builder.cohort === selectedCohort);
  }, [builders, selectedCohort]);
  
  console.log(`[AttendanceChart] Selected cohort: ${selectedCohort}`);
  console.log(`[AttendanceChart] Filtered builders: ${filteredBuilders.length}/${builders.length}`);
  
  const { data, isLoading, error } = useSimpleAttendanceAnalytics(filteredBuilders, days, selectedCohort);

  const timeFrameOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '14', label: 'Last 14 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '60', label: 'Last 60 days' },
    { value: '90', label: 'Last 90 days' }
  ];

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive font-medium">Error loading analytics</p>
              <p className="text-muted-foreground text-sm mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Attendance Analytics</CardTitle>
            <CardDescription>
              {selectedCohort !== 'All Cohorts' ? `${selectedCohort} - ` : ''}
              Attendance trends over time ({filteredBuilders.length} builders)
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
          <SimpleBarChart data={data?.daily || []} />
        ) : (
          <SimplePieChart data={data?.summary || { totalPresent: 0, totalLate: 0, totalAbsent: 0, totalExcused: 0 }} />
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceChart;
