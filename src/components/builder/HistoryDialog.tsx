
import { useEffect } from 'react';
import { Builder } from './types';
import AttendanceHistoryDialog from './AttendanceHistoryDialog';

interface HistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  builder: Builder;
}

// This component is now a wrapper that redirects to AttendanceHistoryDialog
// This ensures backward compatibility with any components that might still be using HistoryDialog
const HistoryDialog = ({ isOpen, onClose, builder }: HistoryDialogProps) => {
  useEffect(() => {
    if (isOpen) {
      console.log('HistoryDialog opened, redirecting to AttendanceHistoryDialog');
    }
  }, [isOpen]);

  return (
    <AttendanceHistoryDialog
      isOpen={isOpen}
      onClose={onClose}
      builder={builder}
    />
  );
};

export default HistoryDialog;
