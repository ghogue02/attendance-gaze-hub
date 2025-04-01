
import { useMemo, useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import StatisticCard from './StatisticCard';
import { toast } from 'sonner';
import { processAttendanceForDate, processSpecificDateIssues, processPendingAttendance } from '@/services/attendanceService';

interface StatisticsCardsProps {
  builders: Builder[];
}

const StatisticsCards = ({ builders }: StatisticsCardsProps) => {
  // Calculate statistics based on builders data
  const stats = useMemo(() => {
    const totalBuilders = builders.length;
    const presentCount = builders.filter(s => s.status === 'present').length;
    const absentCount = builders.filter(s => s.status === 'absent').length;
    const excusedCount = builders.filter(s => s.status === 'excused').length;
    const pendingCount = builders.filter(s => s.status === 'pending').length;
    const attendanceRate = totalBuilders > 0 ? Math.round((presentCount / totalBuilders) * 100) : 0;
    
    console.log('Statistics calculation:', { 
      totalBuilders, 
      presentCount, 
      absentCount, 
      excusedCount, 
      pendingCount,
      attendanceRate,
      currentDate: new Date().toISOString().split('T')[0],
      buildersSample: builders.slice(0, 2)
    });
    
    return {
      totalBuilders,
      presentCount,
      absentCount,
      excusedCount,
      pendingCount,
      attendanceRate
    };
  }, [builders]);

  // Process specific dates with absent marking issues
  useEffect(() => {
    const processAttendanceIssues = async () => {
      // Process the general set of problematic dates
      await processSpecificDateIssues();
      
      // Define additional specific dates we want to process
      const additionalDates = [
        { date: '2025-03-31', storageKey: 'stats_march_31_2025_fix_applied' }, // Added March 31
        { date: '2025-03-27', storageKey: 'march_27_2025_fix_applied' },
        { date: '2025-03-26', storageKey: 'march_26_2025_fix_applied' }
      ];
      
      // Process each date only if it hasn't been processed before
      for (const { date, storageKey } of additionalDates) {
        if (!localStorage.getItem(storageKey)) {
          console.log(`Processing attendance for ${date} - not yet processed`);
          const result = await processAttendanceForDate(date);
          
          if (result > 0) {
            toast.success(`Fixed ${result} attendance records for ${date}`);
            console.log(`Successfully fixed ${result} attendance records for ${date}`);
          } else {
            // If no records were updated, try the alternative method
            console.log(`No records updated via standard method for ${date}, trying direct processing`);
            const directResult = await processPendingAttendance(date);
            
            if (directResult > 0) {
              toast.success(`Fixed ${directResult} attendance records for ${date} (direct method)`);
            } else {
              console.log(`No pending attendance records found for ${date}`);
            }
          }
          
          // Mark this fix as applied regardless of result
          localStorage.setItem(storageKey, 'true');
        } else {
          console.log(`Skipping ${date} - already processed previously`);
        }
      }
    };
    
    // Run the process on mount
    processAttendanceIssues();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {/* Total Card */}
      <StatisticCard
        title="Total"
        value={stats.totalBuilders}
        color="primary"
        percentage={100}
        delay={0.1}
      />
      
      {/* Present Card */}
      <StatisticCard
        title="Present"
        value={stats.presentCount}
        color="green"
        percentage={stats.attendanceRate}
        delay={0.2}
      />
      
      {/* Absent Card */}
      <StatisticCard
        title="Absent"
        value={stats.absentCount}
        color="red"
        percentage={stats.totalBuilders > 0 ? (stats.absentCount / stats.totalBuilders * 100) : 0}
        delay={0.3}
      />
      
      {/* Excused Card */}
      <StatisticCard
        title="Excused"
        value={stats.excusedCount}
        color="amber"
        percentage={stats.totalBuilders > 0 ? (stats.excusedCount / stats.totalBuilders * 100) : 0}
        delay={0.35}
      />
      
      {/* Pending Card */}
      <StatisticCard
        title="Pending"
        value={stats.pendingCount}
        color="yellow"
        percentage={stats.totalBuilders > 0 ? (stats.pendingCount / stats.totalBuilders * 100) : 0}
        delay={0.4}
      />
    </div>
  );
};

export default StatisticsCards;
