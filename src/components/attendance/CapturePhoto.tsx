
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Builder } from '@/components/BuilderCard';

interface CapturePhotoProps {
  isCapturing: boolean;
  selectedBuilder: Builder | null;
  onCapture: () => void;
}

const CapturePhoto = ({
  isCapturing,
  selectedBuilder,
  onCapture
}: CapturePhotoProps) => {
  const isReady = isCapturing && selectedBuilder;
  
  return (
    <div className="flex flex-col space-y-4">
      {/* Selected builder info */}
      {selectedBuilder && (
        <div className="bg-secondary/40 p-3 rounded-lg flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {selectedBuilder.image ? (
              <img 
                src={selectedBuilder.image} 
                alt={selectedBuilder.name}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <span className="text-primary font-medium">
                {selectedBuilder.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">{selectedBuilder.name}</p>
            <p className="text-sm text-muted-foreground">ID: {selectedBuilder.builderId}</p>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <p className="text-center text-sm text-muted-foreground">
        {selectedBuilder 
          ? 'Position yourself in the frame and take a photo' 
          : 'Please select a builder first'}
      </p>
      
      {/* Capture button */}
      <Button
        onClick={onCapture}
        disabled={!isReady}
        className="flex items-center justify-center gap-2 w-full py-6"
        variant={isReady ? "default" : "outline"}
      >
        <Camera size={20} />
        Take Photo
      </Button>
    </div>
  );
};

export default CapturePhoto;
