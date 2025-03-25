
import { motion } from 'framer-motion';
import { useState } from 'react';
import UserProfileImage from '@/components/dashboard/UserProfileImage';
import { Builder, BuilderCardProps } from './types';
import ExcuseDialog from './ExcuseDialog';
import HistoryDialog from './HistoryDialog';
import BuilderStatusIndicator from './BuilderStatusIndicator';
import BuilderStatusButtons from './BuilderStatusButtons';

const BuilderCard = ({ builder, onVerify }: BuilderCardProps) => {
  const [isExcuseDialogOpen, setIsExcuseDialogOpen] = useState(false);
  const [excuseReason, setExcuseReason] = useState(builder.excuseReason || '');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const handleStatusChange = (status: Builder['status']) => {
    if (status === 'excused') {
      setIsExcuseDialogOpen(true);
    } else if (onVerify) {
      onVerify(builder.id, status);
    }
  };

  const handleExcuseSubmit = (reason: string) => {
    if (onVerify) {
      onVerify(builder.id, 'excused', reason);
    }
    setExcuseReason(reason);
  };

  const handleCardClick = () => {
    setIsHistoryDialogOpen(true);
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
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 shadow-sm border-2 border-white/20">
            <UserProfileImage
              userName={builder.name}
              userId={builder.id}
              className="w-full h-full"
            />
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-lg">{builder.name}</h3>
            <p className="text-sm text-foreground/70 mb-2">ID: {builder.builderId}</p>
            
            <BuilderStatusIndicator 
              status={builder.status}
              timeRecorded={builder.timeRecorded}
              excuseReason={builder.excuseReason}
            />
          </div>
          
          {onVerify && (
            <div onClick={(e) => e.stopPropagation()}>
              <BuilderStatusButtons 
                currentStatus={builder.status}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Excuse dialog */}
      <ExcuseDialog 
        isOpen={isExcuseDialogOpen}
        onClose={() => setIsExcuseDialogOpen(false)}
        onSubmit={handleExcuseSubmit}
        initialReason={excuseReason}
      />

      {/* Attendance History Dialog */}
      <HistoryDialog 
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
        builder={builder}
      />
    </>
  );
};

export default BuilderCard;
