
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
  // Handle the confirm action with proper error handling
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error in delete confirmation handler:', error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isLoading) onClose();
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this attendance record? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAttendanceDialog;
