
import { useMemo, useState, useEffect } from 'react';
import { Builder } from '@/components/builder/types';
import StatisticCard from './StatisticCard';
import { markPendingAsAbsent } from '@/services/attendanceService';
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

  // Process the specific March 27, 2025 date that needs to be fixed
  useEffect(() => {
    const processMarch27 = async () => {
      // Check if we've already run this fix
      const fixAppliedKey = 'march_27_2025_fix_applied';
      if (localStorage.getItem(fixAppliedKey)) {
        return;
      }
      
      const specificDate = '2025-03-27';
      const result = await markPendingAsAbsent(specificDate);
      
      if (result > 0) {
        toast.success(`Fixed ${result} attendance records for ${specificDate}`);
        console.log(`Successfully fixed ${result} attendance records for ${specificDate}`);
      } else {
        console.log(`No pending attendance records found for ${specificDate}`);
      }
      
      // Mark this fix as applied so we don't run it again
      localStorage.setItem(fixAppliedKey, 'true');
    };
    
    processMarch27();
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
