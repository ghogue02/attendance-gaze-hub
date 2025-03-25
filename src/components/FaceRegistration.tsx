
import { useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { Builder } from './builder/types';
import { PhotoCapture } from './PhotoCapture';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface FaceRegistrationProps {
  builder: Builder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const FaceRegistration = ({ builder, open, onOpenChange, onComplete }: FaceRegistrationProps) => {
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  const handleSuccess = (updatedBuilder: Builder) => {
    setRegistrationComplete(true);
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Photo Registration</DialogTitle>
          <DialogDescription>
            Take a photo to update your profile
          </DialogDescription>
        </DialogHeader>
        
        {registrationComplete ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Registration Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Your photo has been successfully saved.
            </p>
          </div>
        ) : (
          <PhotoCapture 
            builder={builder}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FaceRegistration;
