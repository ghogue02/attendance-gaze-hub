
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import BuilderCard, { Builder } from '@/components/BuilderCard';

interface RecognitionResultProps {
  detectedBuilder: Builder;
  passiveMode: boolean;
  reset: () => void;
}

export const RecognitionResult = ({ 
  detectedBuilder, 
  passiveMode, 
  reset 
}: RecognitionResultProps) => {
  return (
    <div className="flex flex-col space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
        <h3 className="text-lg font-medium text-green-800">Attendance Recorded!</h3>
        <p className="text-sm text-green-600 mt-1">
          Successfully verified and recorded.
        </p>
      </div>
      
      <BuilderCard builder={detectedBuilder} />
      
      {passiveMode ? (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Passive mode is active. The system will continue to scan for additional builders.
          </p>
          <Button 
            onClick={reset}
            variant="outline"
          >
            Reset Camera
          </Button>
        </div>
      ) : (
        <Button 
          onClick={reset}
          className="py-4 flex items-center justify-center gap-2 mx-auto md:mx-0"
        >
          Record Another Attendance
        </Button>
      )}
    </div>
  );
};
