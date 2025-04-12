
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Builder, BuilderStatus, BuilderCardProps, AttendanceStats } from './types';
import ExcuseDialog from './ExcuseDialog';
import AttendanceHistoryDialog from './AttendanceHistoryDialog';
import BuilderNotesDialog from './BuilderNotesDialog';
import { Button } from '@/components/ui/button';
import CardHeader from './CardHeader';
import CardContent from './CardContent';
import CardActions from './CardActions';
import { useBuilderAttendance } from '@/hooks/useBuilderAttendance';

const BuilderCard = ({ builder, onVerify, onDeleteRequest, attendanceStats }: BuilderCardProps) => {
  const [isExcuseDialogOpen, setIsExcuseDialogOpen] = useState(false);
  const [excuseReason, setExcuseReason] = useState(builder.excuseReason || '');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [builderData, setBuilderData] = useState<Builder>(builder);
  
  // Only use the hook for attendance history when the dialog is open
  // This is more efficient than always loading attendance data
  const { attendanceRate: hookAttendanceRate, isLoading } = useBuilderAttendance(
    builderData.id, 
    isHistoryDialogOpen
  );
  
  // Determine which attendance stats to use - prefer props over hook for efficiency
  let finalAttendanceStats: AttendanceStats | null = null;
  
  if (attendanceStats) {
    // Use the full stats object from props (preferred, pre-calculated by parent)
    finalAttendanceStats = attendanceStats;
  } else if (hookAttendanceRate !== null) {
    // Fallback to the hook's rate if props aren't available
    finalAttendanceStats = {
      rate: hookAttendanceRate,
      presentCount: 0, // We don't have these values from the hook
      totalClassDays: 0 // We don't have these values from the hook
    };
  }
  
  // Extract rate for backward compatibility with components expecting just the rate
  const finalAttendanceRate = finalAttendanceStats?.rate ?? null;

  console.log(`[BuilderCard] Rendering ${builderData.name} with stats:`, finalAttendanceStats);

  const handleStatusChange = (status: Builder['status']) => {
    if (status === 'excused') {
      setIsExcuseDialogOpen(true);
    } else if (onVerify) {
      onVerify(builderData.id, status);
    }
  };

  const handleExcuseSubmit = (reason: string) => {
    if (onVerify) {
      onVerify(builderData.id, 'excused', reason);
    }
    setExcuseReason(reason);
  };

  const handleCardClick = () => {
    setIsHistoryDialogOpen(true);
  };

  const handleNotesUpdated = (notes: string) => {
    setBuilderData(prev => ({
      ...prev,
      notes: notes
    }));
  };

  const handleNotesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNotesDialogOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card p-5 transition-all duration-300 hover:shadow-glass-lg cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex flex-col gap-4">
          <CardHeader 
            builder={builderData}
            attendanceRate={finalAttendanceRate}
            onNotesClick={handleNotesClick}
          />
          
          <CardContent builder={builderData} />
          
          <div onClick={(e) => e.stopPropagation()}>
            <CardActions 
              currentStatus={builderData.status}
              onStatusChange={onVerify ? handleStatusChange : undefined}
              onDeleteRequest={onDeleteRequest}
            />
          </div>
        </div>
      </motion.div>

      {/* Dialogs */}
      <ExcuseDialog 
        isOpen={isExcuseDialogOpen}
        onClose={() => setIsExcuseDialogOpen(false)}
        onSubmit={handleExcuseSubmit}
        initialReason={excuseReason}
      />

      <AttendanceHistoryDialog 
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
        builder={builderData}
      />
      
      <BuilderNotesDialog
        isOpen={isNotesDialogOpen}
        onClose={() => setIsNotesDialogOpen(false)}
        builder={builderData}
        onNotesUpdated={handleNotesUpdated}
      />
    </>
  );
};

export default BuilderCard;
