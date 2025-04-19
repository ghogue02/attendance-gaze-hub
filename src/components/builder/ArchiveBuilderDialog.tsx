
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { archiveBuilder } from '@/utils/builders/builderOperations';

interface ArchiveBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  builder: { id: string, name: string } | null;
  onBuilderArchived: () => void;
}

export const ArchiveBuilderDialog = ({
  open,
  onOpenChange,
  builder,
  onBuilderArchived
}: ArchiveBuilderDialogProps) => {
  const [isArchiving, setIsArchiving] = useState(false);
  const [reason, setReason] = useState('');

  const handleArchive = async () => {
    if (!builder) return;
    
    setIsArchiving(true);
    try {
      const success = await archiveBuilder(builder.id, reason);
      if (success) {
        onBuilderArchived();
        onOpenChange(false);
      }
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Builder?</AlertDialogTitle>
          <AlertDialogDescription>
            This will archive {builder?.name}'s record. They will no longer appear in the active builders list,
            but their data will be preserved for reporting purposes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Please provide a reason for archiving this builder..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isArchiving || !reason.trim()}
            onClick={(e) => {
              e.preventDefault();
              handleArchive();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isArchiving ? 'Archiving...' : 'Archive'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
