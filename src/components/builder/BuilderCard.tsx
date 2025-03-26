
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Builder, BuilderStatus, BuilderCardProps } from './types';
import ExcuseDialog from './ExcuseDialog';
import AttendanceHistoryDialog from './AttendanceHistoryDialog';
import BuilderNotesDialog from './BuilderNotesDialog';
import { FileTextIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CardHeader from './CardHeader';
import CardContent from './CardContent';
import CardActions from './CardActions';
import { useBuilderAttendance } from './useBuilderAttendance';

const BuilderCard = ({ builder, onVerify, onDeleteRequest }: BuilderCardProps) => {
  const [isExcuseDialogOpen, setIsExcuseDialogOpen] = useState(false);
  const [excuseReason, setExcuseReason] = useState(builder.excuseReason || '');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [builderData, setBuilderData] = useState<Builder>(builder);
  
  // Use the custom hook to get attendance rate
  const { attendanceRate } = useBuilderAttendance(builderData.id);

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
            attendanceRate={attendanceRate}
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
