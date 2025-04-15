import { useMemo, useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import StatisticCard from './StatisticCard';
import { toast } from 'sonner';
import { 
  processAttendanceForDate, 
  processPendingAttendance, 
  markPendingAsAbsent,
  removeApril4thRecords
} from '@/services/attendance';
import { processSpecificDateIssues } from '@/services/attendance/historicalDates';

interface StatisticsCardsProps {
  builders: Builder[];
}

const StatisticsCards = ({ builders }: StatisticsCardsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
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
      currentDate: new Date().toISOString().split('T')[0]
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
      if (isProcessing) return; // Prevent concurrent processing
      setIsProcessing(true);
      
      try {
        // Process the general set of problematic dates
        await processSpecificDateIssues();
        
        // Get current date for automatic processing
        const today = new Date().toISOString().split('T')[0];
        
        // If we have a significant number of pending records, try to fix them
        if (stats.pendingCount > 0 && stats.pendingCount / stats.totalBuilders > 0.5) {
          console.log(`High pending count detected (${stats.pendingCount}/${stats.totalBuilders}), running auto-fix`);
          const result = await markPendingAsAbsent(today);
          
          if (result > 0) {
            toast.success(`Updated attendance status for ${result} students`);
          }
        }
        
        // Remove April 4th records (Friday)
        const april4StorageKey = 'april_4_2025_records_removed';
        if (!localStorage.getItem(april4StorageKey)) {
          console.log('Removing April 4, 2025 (Friday) records');
          const removed = await removeApril4thRecords();
          
          if (removed > 0) {
            toast.success(`Removed ${removed} records from April 4, 2025 (Friday)`);
            localStorage.setItem(april4StorageKey, 'true');
          }
        }
        
        // Define additional specific dates we want to process - excluding Fridays
        const additionalDates = [
          { date: '2025-04-05', storageKey: 'stats_april_5_2025_fix_applied', isFriday: false },
          { date: '2025-04-04', storageKey: 'stats_april_4_2025_fix_applied', isFriday: true },
          { date: '2025-04-03', storageKey: 'stats_april_3_2025_fix_applied', isFriday: false },
          { date: '2025-04-02', storageKey: 'stats_april_2_2025_fix_applied', isFriday: false },
          { date: '2025-04-01', storageKey: 'stats_april_1_2025_fix_applied', isFriday: false },
          { date: '2025-03-31', storageKey: 'stats_march_31_2025_fix_applied', isFriday: false }
        ];
        
        // Process each date only if it hasn't been processed before - and not a Friday
        for (const { date, storageKey, isFriday } of additionalDates) {
          if (isFriday) {
            console.log(`Skipping ${date} - it's a Friday (no classes)`);
            continue;
          }
          
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
      } catch (error) {
        console.error('Error processing attendance issues:', error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    // Run the process on mount
    processAttendanceIssues();
  }, [stats.pendingCount, stats.totalBuilders]);

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
