
import { motion } from 'framer-motion';
import { useState } from 'react';
import UserProfileImage from '@/components/dashboard/UserProfileImage';
import { Builder, BuilderCardProps } from './types';
import ExcuseDialog from './ExcuseDialog';
import HistoryDialog from './HistoryDialog';
import BuilderStatusIndicator from './BuilderStatusIndicator';
import BuilderStatusButtons from './BuilderStatusButtons';
import BuilderNotesDialog from './BuilderNotesDialog';
import { Button } from '@/components/ui/button';
import { FileTextIcon, Trash2 } from 'lucide-react';

const BuilderCard = ({ builder, onVerify, onDeleteRequest }: BuilderCardProps) => {
  const [isExcuseDialogOpen, setIsExcuseDialogOpen] = useState(false);
  const [excuseReason, setExcuseReason] = useState(builder.excuseReason || '');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [builderData, setBuilderData] = useState<Builder>(builder);

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
              userName={builderData.name}
              userId={builderData.id}
              className="w-full h-full"
            />
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-lg">{builderData.name}</h3>
                <p className="text-sm text-foreground/70 mb-2">ID: {builderData.builderId}</p>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotesDialogOpen(true);
                }}
              >
                <FileTextIcon className="h-4 w-4" />
                {builderData.notes ? 'Edit Notes' : 'Add Notes'}
              </Button>
            </div>
            
            <BuilderStatusIndicator 
              status={builderData.status}
              timeRecorded={builderData.timeRecorded}
              excuseReason={builderData.excuseReason}
            />
            
            {builderData.notes && (
              <div className="mt-2 text-sm bg-muted/30 p-2 rounded-md truncate max-w-[400px]" title={builderData.notes}>
                <span className="font-medium">Notes:</span> {builderData.notes}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            {onVerify && (
              <BuilderStatusButtons 
                currentStatus={builderData.status}
                onStatusChange={handleStatusChange}
              />
            )}
            
            {onDeleteRequest && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onDeleteRequest()}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
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
        builder={builderData}
      />
      
      {/* Builder Notes Dialog */}
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
