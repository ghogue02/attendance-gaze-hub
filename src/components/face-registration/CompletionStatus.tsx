
import { Check, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

interface CompletionStatusProps {
  isComplete: boolean;
  isUpdateMode: boolean;
  onComplete: () => void;
  onStartOver: () => void;
}

export const CompletionStatus = ({
  isComplete,
  isUpdateMode,
  onComplete,
  onStartOver
}: CompletionStatusProps) => {
  if (!isComplete) return null;
  
  if (isUpdateMode) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
        </div>
        <h3 className="text-xl font-medium mb-2">Update Registration</h3>
        <p className="text-muted-foreground mb-6">
          You've already completed face registration, but you can update your images 
          to improve recognition accuracy.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onComplete}>
            Cancel
          </Button>
          <Button onClick={onStartOver}>
            Re-register Face
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-medium mb-2">Registration Complete!</h3>
      <p className="text-muted-foreground mb-6">
        Your face has been successfully registered from all required angles.
      </p>
      <Button onClick={onComplete}>
        Done
      </Button>
    </div>
  );
};
