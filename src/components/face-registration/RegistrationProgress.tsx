
import { ChevronRight, Check } from 'lucide-react';

interface RegistrationProgressProps {
  progress: number;
  currentAngle: number;
  capturedImages: string[];
  angleInstructions: string[];
}

export const RegistrationProgress = ({
  progress,
  currentAngle,
  capturedImages,
  angleInstructions
}: RegistrationProgressProps) => {
  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Registration Progress</h3>
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {Math.min(capturedImages.filter(Boolean).length, 5)} of 5 angles completed
        </p>
      </div>
      
      <div className="bg-muted p-4 rounded-lg mb-6">
        <h4 className="font-medium mb-2">Current Angle</h4>
        <div className="flex items-center text-primary mb-1">
          <ChevronRight size={16} className="mr-1" />
          <p className="text-sm">{angleInstructions[currentAngle]}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Position your face within the frame and follow the instructions.
        </p>
      </div>
      
      <div className="grid grid-cols-5 gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div 
            key={index}
            className={`aspect-square rounded-md border-2 ${
              capturedImages[index] 
                ? 'border-green-500 bg-green-50' 
                : index === currentAngle 
                  ? 'border-primary animate-pulse' 
                  : 'border-muted bg-muted/50'
            }`}
          >
            {capturedImages[index] && (
              <div className="h-full w-full flex items-center justify-center">
                <Check className="h-4 w-4 text-green-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};
