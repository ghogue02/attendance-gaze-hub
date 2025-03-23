
import { useState } from 'react';
import { toast } from 'sonner';
import { SimplifiedCapture } from './SimplifiedCapture';
import { Builder } from '@/components/BuilderCard';

interface SimpleFaceCaptureProps {
  builder: Builder;
  onRegistrationComplete: (success: boolean) => void;
  isUpdateMode?: boolean;
}

export const SimpleFaceCapture = ({
  builder,
  onRegistrationComplete,
  isUpdateMode = false
}: SimpleFaceCaptureProps) => {
  const [mode, setMode] = useState<'simplified' | 'advanced'>('simplified');

  const handleRegistrationComplete = (success: boolean) => {
    if (success) {
      toast.success('Face registration completed successfully!');
    }
    onRegistrationComplete(success);
  };
  
  return (
    <div className="space-y-6">
      {/* We're using simplified mode by default for now */}
      <SimplifiedCapture 
        builder={builder} 
        onRegistrationComplete={handleRegistrationComplete} 
      />
    </div>
  );
};
