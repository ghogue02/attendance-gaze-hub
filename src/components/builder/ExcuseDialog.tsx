
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BuilderStatus } from './types';

interface ExcuseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  initialReason?: string;
}

const ExcuseDialog = ({ isOpen, onClose, onSubmit, initialReason = '' }: ExcuseDialogProps) => {
  const [excuseReason, setExcuseReason] = useState(initialReason);

  const handleSubmit = () => {
    onSubmit(excuseReason);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcuseDialog;
