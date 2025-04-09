
import { 
  AlertDialog,
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface DeleteAttendanceDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteAttendanceDialog = ({
  isOpen,
  isLoading,
  onClose,
  onConfirm
}: DeleteAttendanceDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Handle the confirm action with proper error handling
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setIsDeleting(true);
      await onConfirm();
      // Close dialog after successful operation
      onClose();
    } catch (error) {
      console.error('Error in delete confirmation handler:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      // Only allow closing if we're not in the middle of an operation
      if (!open && !isLoading && !isDeleting) onClose();
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this attendance record? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading || isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            disabled={isLoading || isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAttendanceDialog;
