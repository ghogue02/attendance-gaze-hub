
import { motion } from 'framer-motion';
import { UserCheck, UserX, Clock } from 'lucide-react';
import { useState } from 'react';
import UserProfileImage from './dashboard/UserProfileImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

export type BuilderStatus = 'present' | 'absent' | 'excused' | 'pending';

export interface Builder {
  id: string;
  name: string;
  builderId: string;
  status: BuilderStatus;
  timeRecorded?: string;
  image?: string;
  excuseReason?: string;
}

interface BuilderCardProps {
  builder: Builder;
  onVerify?: (builderId: string, status: BuilderStatus, reason?: string) => void;
}

const BuilderCard = ({ builder, onVerify }: BuilderCardProps) => {
  const [isExcuseDialogOpen, setIsExcuseDialogOpen] = useState(false);
  const [excuseReason, setExcuseReason] = useState(builder.excuseReason || '');

  const getStatusColor = (status: BuilderStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'absent':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'excused':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: BuilderStatus) => {
    switch (status) {
      case 'present':
        return <UserCheck className="w-4 h-4" />;
      case 'absent':
      case 'excused':
        return <UserX className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleStatusChange = (status: BuilderStatus) => {
    if (status === 'excused') {
      setIsExcuseDialogOpen(true);
    } else if (onVerify) {
      onVerify(builder.id, status);
    }
  };

  const handleExcuseSubmit = () => {
    if (onVerify) {
      onVerify(builder.id, 'excused', excuseReason);
    }
    setIsExcuseDialogOpen(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card p-5 transition-all duration-300 hover:shadow-glass-lg"
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
            
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(builder.status)}`}>
              {getStatusIcon(builder.status)}
              <span className="ml-1 capitalize">{builder.status === 'excused' ? 'Excused Absence' : builder.status}</span>
            </div>
            
            {builder.timeRecorded && (
              <p className="text-xs text-foreground/60 mt-2">
                {builder.status === 'present' ? 'Recorded at: ' : 'Last check: '}
                {builder.timeRecorded}
              </p>
            )}
            
            {builder.excuseReason && builder.status === 'excused' && (
              <p className="text-xs italic text-foreground/60 mt-1">
                Reason: {builder.excuseReason}
              </p>
            )}
          </div>
          
          {onVerify && (
            <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
              <Button
                variant="outline" 
                size="sm"
                className={`${builder.status === 'present' ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
                onClick={() => handleStatusChange('present')}
              >
                Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${builder.status === 'excused' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}
                onClick={() => handleStatusChange('excused')}
              >
                Excused
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${builder.status === 'absent' ? 'bg-red-100 text-red-700 border-red-300' : ''}`}
                onClick={() => handleStatusChange('absent')}
              >
                Absent
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      <Dialog open={isExcuseDialogOpen} onOpenChange={setIsExcuseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Excuse Reason</DialogTitle>
          </DialogHeader>
          <Textarea
            value={excuseReason}
            onChange={(e) => setExcuseReason(e.target.value)}
            placeholder="Enter the reason for excused absence..."
            className="min-h-[120px]"
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsExcuseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExcuseSubmit}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BuilderCard;
