
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { Builder } from './BuilderCard';
import { checkFaceRegistrationStatus } from '@/utils/faceRecognition';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { SimpleFaceCapture } from './face-registration/SimpleFaceCapture';

interface FaceRegistrationProps {
  builder: Builder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const FaceRegistration = ({ builder, open, onOpenChange, onComplete }: FaceRegistrationProps) => {
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open && builder) {
      checkRegistrationStatus();
    }
  }, [open, builder]);
  
  const checkRegistrationStatus = async () => {
    if (!builder) return;
    
    try {
      const status = await checkFaceRegistrationStatus(builder.id);
      console.log("Registration status:", status);
      
      if (status.completed) {
        setRegistrationComplete(true);
        setProgress(100);
        setIsUpdateMode(status.count >= 5);
      } else {
        setProgress((status.count / 5) * 100);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const handleRegistrationComplete = (success: boolean) => {
    if (success) {
      setRegistrationComplete(true);
      setProgress(100);
      checkRegistrationStatus();
      onComplete?.();
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Face Registration</DialogTitle>
          <DialogDescription>
            Please register your face to improve recognition accuracy.
          </DialogDescription>
        </DialogHeader>
        
        {registrationComplete ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Registration Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Your face has been successfully registered.
            </p>
            <Button onClick={handleComplete}>
              Done
            </Button>
          </div>
        ) : (
          <SimpleFaceCapture 
            builder={builder}
            onRegistrationComplete={handleRegistrationComplete}
            isUpdateMode={isUpdateMode}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FaceRegistration;
