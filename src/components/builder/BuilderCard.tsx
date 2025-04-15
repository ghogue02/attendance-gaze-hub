
import { motion } from 'framer-motion';
import { useState, memo } from 'react';
import { Builder, BuilderStatus, BuilderCardProps } from './types';
import ExcuseDialog from './ExcuseDialog';
import AttendanceHistoryDialog from './AttendanceHistoryDialog';
import BuilderNotesDialog from './BuilderNotesDialog';
import CardHeader from './CardHeader';
import CardContent from './CardContent';
import CardActions from './CardActions';

// Memoize BuilderCard to prevent unnecessary re-renders
const BuilderCard = memo(({ builder, onVerify, onDeleteRequest, attendanceStats }: BuilderCardProps) => {
  const [isExcuseDialogOpen, setIsExcuseDialogOpen] = useState(false);
  const [excuseReason, setExcuseReason] = useState(builder.excuseReason || '');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [builderData, setBuilderData] = useState<Builder>(builder);
  
  // Log to help debug attendance issues (but only when really needed)
  if (attendanceStats) {
    console.log(`[BuilderCard] Rendering ${builderData.name} with stats:`, attendanceStats);
  }

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
            attendanceStats={attendanceStats}
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

      {/* Only render dialogs when they're open to reduce DOM nodes */}
      {isExcuseDialogOpen && (
        <ExcuseDialog 
          isOpen={true}
          onClose={() => setIsExcuseDialogOpen(false)}
          onSubmit={handleExcuseSubmit}
          initialReason={excuseReason}
        />
      )}

      {isHistoryDialogOpen && (
        <AttendanceHistoryDialog 
          isOpen={true}
          onClose={() => setIsHistoryDialogOpen(false)}
          builder={builderData}
        />
      )}
      
      {isNotesDialogOpen && (
        <BuilderNotesDialog
          isOpen={true}
          onClose={() => setIsNotesDialogOpen(false)}
          builder={builderData}
          onNotesUpdated={handleNotesUpdated}
        />
      )}
    </>
  );
});

// Add display name to help with debugging
BuilderCard.displayName = 'BuilderCard';

export default BuilderCard;
