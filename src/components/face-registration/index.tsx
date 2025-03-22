
import { useState, useEffect } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { Builder } from '../BuilderCard';
import { checkFaceRegistrationStatus } from '@/utils/faceRecognition';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { SimpleFaceCapture } from './SimpleFaceCapture';
import { Button } from '../ui/button';

interface FaceRegistrationProps {
  builder: Builder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const FaceRegistration = ({ builder, open, onOpenChange, onComplete }: FaceRegistrationProps) => {
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
        setIsUpdateMode(true);
      } else {
        setRegistrationComplete(false);
        setIsUpdateMode(false);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
      setRegistrationComplete(false);
      setIsUpdateMode(false);
    }
  };

  const handleRegistrationComplete = (success: boolean) => {
    if (success) {
      setRegistrationComplete(true);
      // Allow a moment to see the success message
      setTimeout(() => {
        handleComplete();
      }, 1500);
    }
  };

  const handleStartOver = () => {
    setRegistrationComplete(false);
  };

  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Face Registration</DialogTitle>
          <DialogDescription>
            {isUpdateMode 
              ? "Update your face registration to improve recognition accuracy" 
              : "Register your face to enable face recognition for attendance"}
          </DialogDescription>
        </DialogHeader>
        
        {registrationComplete && !isUpdateMode ? (
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
        ) : registrationComplete && isUpdateMode ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Update Registration</h3>
            <p className="text-muted-foreground mb-6">
              You've already completed face registration, but you can update your face data
              to improve recognition accuracy.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleComplete}>
                Cancel
              </Button>
              <Button onClick={handleStartOver}>
                Re-register Face
              </Button>
            </div>
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
