
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Builder } from '../BuilderCard';
import { checkFaceRegistrationStatus } from '@/utils/faceRecognition';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { RegistrationCapture } from './RegistrationCapture';
import { CompletionStatus } from './CompletionStatus';

interface FaceRegistrationProps {
  builder: Builder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const FaceRegistration = ({ builder, open, onOpenChange, onComplete }: FaceRegistrationProps) => {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [progress, setProgress] = useState(0);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  
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
        setCurrentAngle(status.count);
        setProgress((status.count / 5) * 100);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const handleStartOver = () => {
    setCurrentAngle(0);
    setRegistrationComplete(false);
    setProgress(0);
  };

  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
  };
  
  const handleRegistrationUpdate = (completed: boolean, newProgress: number, newAngle: number) => {
    setRegistrationComplete(completed);
    setProgress(newProgress);
    setCurrentAngle(newAngle);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Face Registration</DialogTitle>
          <DialogDescription>
            Please register your face from multiple angles to improve recognition accuracy.
          </DialogDescription>
        </DialogHeader>
        
        {registrationComplete ? (
          <CompletionStatus 
            isComplete={registrationComplete} 
            isUpdateMode={isUpdateMode}
            onComplete={handleComplete}
            onStartOver={handleStartOver}
          />
        ) : (
          <RegistrationCapture 
            builder={builder}
            onRegistrationUpdate={handleRegistrationUpdate}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FaceRegistration;
