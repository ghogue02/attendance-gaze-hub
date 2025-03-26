
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import UserProfileImage from '@/components/dashboard/UserProfileImage';
import { Builder, BuilderCardProps } from './types';
import ExcuseDialog from './ExcuseDialog';
import BuilderStatusIndicator from './BuilderStatusIndicator';
import BuilderStatusButtons from './BuilderStatusButtons';
import BuilderNotesDialog from './BuilderNotesDialog';
import AttendanceHistoryDialog from './AttendanceHistoryDialog';
import { Button } from '@/components/ui/button';
import { FileTextIcon, Trash2, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const BuilderCard = ({ builder, onVerify, onDeleteRequest }: BuilderCardProps) => {
  const [isExcuseDialogOpen, setIsExcuseDialogOpen] = useState(false);
  const [excuseReason, setExcuseReason] = useState(builder.excuseReason || '');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [builderData, setBuilderData] = useState<Builder>(builder);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAttendanceRate();
  }, [builderData.id]);

  const fetchAttendanceRate = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', builderData.id);

      if (error) {
        console.error('Error fetching builder attendance history:', error);
        return;
      }

      if (data.length === 0) {
        setAttendanceRate(null);
        return;
      }

      // Filter out Fridays from attendance records
      const nonFridayRecords = data.filter(record => {
        const date = new Date(record.date);
        return date.getDay() !== 5; // 5 is Friday (0 is Sunday)
      });

      if (nonFridayRecords.length === 0) {
        setAttendanceRate(null);
        return;
      }

      // Count the number of days the builder was present or late
      const presentCount = nonFridayRecords.filter(
        record => record.status === 'present' || record.status === 'late'
      ).length;

      // Calculate the rate
      const rate = (presentCount / nonFridayRecords.length) * 100;
      setAttendanceRate(Math.round(rate));
    } catch (error) {
      console.error('Error in fetchAttendanceRate:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
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
              
              <div className="flex flex-col items-end gap-1">
                {attendanceRate !== null && (
                  <div className="flex items-center gap-1 text-xs bg-muted/40 px-2 py-1 rounded-full">
                    <CalendarIcon className="h-3 w-3" />
                    <span>Attendance:</span>
                    <span className={`font-bold ${getAttendanceRateColor(attendanceRate)}`}>
                      {attendanceRate}%
                    </span>
                  </div>
                )}
                
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
