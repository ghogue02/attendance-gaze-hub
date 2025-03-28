
import { useState, useEffect } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { Builder } from '../builder/types';
import { checkFaceRegistrationStatus } from '@/utils/faceRecognition';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { PhotoCapture } from '../PhotoCapture';
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
      console.log("FaceRegistration dialog opened for builder:", builder.id);
      checkRegistrationStatus();
    }
  }, [open, builder]);
  
  const checkRegistrationStatus = async () => {
    if (!builder) return;
    
    try {
      const status = await checkFaceRegistrationStatus(builder.id);
      console.log("Registration status checked:", status);
      
      if (status.completed) {
        console.log("Builder has completed registration, setting update mode");
        setRegistrationComplete(true);
        setIsUpdateMode(true);
      } else {
        console.log("Builder has not completed registration, disabling update mode");
        setRegistrationComplete(false);
        setIsUpdateMode(false);
      }
    } catch (error) {
      console.error('Error checking face registration status:', error);
      setRegistrationComplete(false);
      setIsUpdateMode(false);
    }
  };

  const handleSuccess = (updatedBuilder: Builder) => {
    console.log("Registration completed successfully");
    setRegistrationComplete(true);
    
    // Allow a moment to see the success message
    setTimeout(() => {
      if (onComplete) {
        console.log("Calling onComplete callback");
        onComplete();
      }
      handleComplete();
    }, 1500);
  };

  const handleStartOver = () => {
    console.log("Starting over with registration");
    setRegistrationComplete(false);
  };

  const handleComplete = () => {
    console.log("Registration complete, closing dialog");
    onOpenChange(false);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Face Registration</DialogTitle>
          <DialogDescription>
            {isUpdateMode 
              ? "Update your photo to improve your profile" 
              : "Register your photo to enable attendance tracking"}
          </DialogDescription>
        </DialogHeader>
        
        {registrationComplete && !isUpdateMode ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Registration Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Your photo has been successfully registered.
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
              You've already completed registration, but you can update your photo
              if needed.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleComplete}>
                Cancel
              </Button>
              <Button onClick={handleStartOver}>
                Update Photo
              </Button>
            </div>
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
