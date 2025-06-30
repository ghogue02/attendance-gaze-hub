
import { useMemo, useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import StatisticCard from './StatisticCard';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { 
  processAttendanceForDate, 
  processPendingAttendance, 
  markPendingAsAbsent,
  removeApril4thRecords
} from '@/services/attendance';
import { processSpecificDateIssues } from '@/services/attendance/historicalDates';
import { isCancelledClassDaySync, CANCELLED_CLASSES } from '@/utils/attendance/isClassDay';

interface StatisticsCardsProps {
  builders: Builder[];
}

const StatisticsCards = ({ builders }: StatisticsCardsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const isCancelledDay = isCancelledClassDaySync(today);
  
  // Calculate statistics based on builders data
  const stats = useMemo(() => {
    // No more filtering based on Sunday - show actual data for all days
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
      isCancelledDay,
      currentDate: today
    });
    
    return {
      totalBuilders,
      presentCount,
      absentCount,
      excusedCount,
      pendingCount,
      attendanceRate,
      isCancelledDay
    };
  }, [builders, isCancelledDay]);

  // Process specific dates with absent marking issues - EXCLUDE CURRENT DAY
  useEffect(() => {
    const processAttendanceIssues = async () => {
      if (isProcessing) return; // Prevent concurrent processing
      setIsProcessing(true);
      
      try {
        // Process the general set of problematic dates (historical only)
        await processSpecificDateIssues();
        
        // Get current date for comparison
        const currentDate = new Date().toISOString().split('T')[0];
        
        // CRITICAL FIX: Do NOT run automated processing for the current day
        // This prevents race conditions with manual attendance entries
        console.log(`[StatisticsCards] SKIPPING automated processing for current day (${currentDate}) to preserve manual entries`);
        
        // Only process if we have a significant number of pending records AND it's not the current day
        if (stats.pendingCount > 0 && stats.pendingCount / stats.totalBuilders > 0.8) {
          console.log(`[StatisticsCards] High pending count detected (${stats.pendingCount}/${stats.totalBuilders}), but skipping current day processing to preserve manual entries`);
          
          // Only process historical dates, not today
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayString = yesterday.toISOString().split('T')[0];
          
          console.log(`[StatisticsCards] Processing yesterday (${yesterdayString}) instead of today to avoid conflicts`);
          const result = await markPendingAsAbsent(yesterdayString);
          
          if (result > 0) {
            toast.success(`Updated attendance status for ${result} students on ${yesterdayString}`);
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
        
        // Define additional specific dates we want to process - excluding Fridays, Sundays, and CURRENT DAY
        const additionalDates = [
          { date: '2025-04-20', storageKey: 'stats_april_20_2025_fix_applied', isSunday: true },
          { date: '2025-04-05', storageKey: 'stats_april_5_2025_fix_applied', isSaturday: true, isWeekend: true },
          { date: '2025-04-04', storageKey: 'stats_april_4_2025_fix_applied', isFriday: true },
          { date: '2025-04-03', storageKey: 'stats_april_3_2025_fix_applied', isFriday: false },
          { date: '2025-04-02', storageKey: 'stats_april_2_2025_fix_applied', isFriday: false },
          { date: '2025-04-01', storageKey: 'stats_april_1_2025_fix_applied', isFriday: false },
          { date: '2025-03-31', storageKey: 'stats_march_31_2025_fix_applied', isFriday: false }
        ];
        
        // Process each date only if it hasn't been processed before - excluding Fridays, Sundays, and CURRENT DAY
        for (const { date, storageKey, isFriday, isSunday, isWeekend } of additionalDates) {
          // CRITICAL: Skip current day to prevent overwriting manual entries
          if (date === currentDate) {
            console.log(`[StatisticsCards] SKIPPING ${date} - it's the current day, manual entries take priority`);
            continue;
          }
          
          if (isFriday) {
            console.log(`Skipping ${date} - it's a Friday (no classes)`);
            continue;
          }
          
          if (isSunday) {
            console.log(`Skipping ${date} - it's a Sunday (no classes)`);
            continue;
          }
          
          if (isWeekend) {
            console.log(`Skipping ${date} - it's a weekend day (only processing weekdays except Friday)`);
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
    
    // Only run the process on mount, with delays to avoid conflicts with manual entries
    const timeoutId = setTimeout(() => {
      processAttendanceIssues();
    }, 3000); // 3 second delay to allow manual entries to complete first
    
    return () => clearTimeout(timeoutId);
  }, []); // Remove stats dependencies to prevent repeated runs

  return (
    <>
      {isCancelledDay && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          <span>Today is a <strong>cancelled class day</strong>. Attendance data is still being shown but attendance may not be required.</span>
        </div>
      )}
      
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
    </>
  );
};

export default StatisticsCards;
