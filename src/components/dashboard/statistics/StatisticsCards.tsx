
import { useMemo, useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import StatisticCard from './StatisticCard';
import { markPendingAsAbsent } from '@/utils/attendance';
import { toast } from 'sonner';

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

  // Process the specific March dates that need to be fixed
  useEffect(() => {
    const processMarchDates = async () => {
      // Check which fixes have already been applied
      const march27FixKey = 'march_27_2025_fix_applied';
      const march26FixKey = 'march_26_2025_fix_applied';
      
      // Process March 27 if not already fixed
      if (!localStorage.getItem(march27FixKey)) {
        const date27 = '2025-03-27';
        const result27 = await markPendingAsAbsent(date27);
        
        if (result27 > 0) {
          toast.success(`Fixed ${result27} attendance records for ${date27}`);
          console.log(`Successfully fixed ${result27} attendance records for ${date27}`);
        } else {
          console.log(`No pending attendance records found for ${date27}`);
        }
        
        // Mark this fix as applied
        localStorage.setItem(march27FixKey, 'true');
      }
      
      // Process March 26 if not already fixed
      if (!localStorage.getItem(march26FixKey)) {
        const date26 = '2025-03-26';
        const result26 = await markPendingAsAbsent(date26);
        
        if (result26 > 0) {
          toast.success(`Fixed ${result26} attendance records for ${date26}`);
          console.log(`Successfully fixed ${result26} attendance records for ${date26}`);
        } else {
          console.log(`No pending attendance records found for ${date26}`);
        }
        
        // Mark this fix as applied
        localStorage.setItem(march26FixKey, 'true');
      }
    };
    
    processMarchDates();
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
