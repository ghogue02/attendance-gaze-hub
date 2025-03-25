
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface CaptureButtonProps {
  onClick: () => void;
  disabled: boolean;
  processing: boolean;
}

const CaptureButton = ({ onClick, disabled, processing }: CaptureButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2"
      size="lg"
    >
      {processing ? (
        <span>Processing...</span>
      ) : (
        <>
          <Camera size={18} />
          <span>Mark Attendance</span>
        </>
      )}
    </Button>
  );
};

export default CaptureButton;
