
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Builder } from '@/components/builder/types';
import StatisticCard from './StatisticCard';
import HistoricalProcessingDialog from './HistoricalProcessingDialog';

interface StatisticsCardsProps {
  builders: Builder[];
}

const StatisticsCards = ({ builders }: StatisticsCardsProps) => {
  const [isHistoricalDialogOpen, setIsHistoricalDialogOpen] = useState(false);

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

  // Process history button for pending statistics card
  const ProcessHistoryButton = (
    <Button 
      variant="outline" 
      size="sm" 
      className="px-2 py-1 h-auto text-xs flex items-center gap-1"
      onClick={() => setIsHistoricalDialogOpen(true)}
    >
      <Calendar size={12} />
      Process History
    </Button>
  );

  return (
    <>
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
        
        {/* Pending Card with Process History button */}
        <StatisticCard
          title="Pending"
          value={stats.pendingCount}
          color="yellow"
          percentage={stats.totalBuilders > 0 ? (stats.pendingCount / stats.totalBuilders * 100) : 0}
          delay={0.4}
          action={ProcessHistoryButton}
        />
      </div>

      {/* Historical Processing Dialog */}
      <HistoricalProcessingDialog
        isOpen={isHistoricalDialogOpen}
        onClose={() => setIsHistoricalDialogOpen(false)}
      />
    </>
  );
};

export default StatisticsCards;
