
import { Builder } from '@/components/builder/types';
import { PhotoCapture } from '@/components/PhotoCapture';
import { Camera } from 'lucide-react';

interface PhotoCaptureSectionProps {
  selectedBuilder: Builder | null;
  onBuilderDetected: (builder: Builder) => void;
}

const PhotoCaptureSection = ({ 
  selectedBuilder,
  onBuilderDetected
}: PhotoCaptureSectionProps) => {
  return (
    <div className="glass-card p-6 rounded-lg shadow-sm w-full flex flex-col items-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Camera size={40} className="text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-center">Photo Capture</h2>
      <p className="text-muted-foreground text-center mb-2">
        {selectedBuilder?.id ? 
          <>Take a photo to mark attendance</> : 
          <>Find your name, then take a photo</>
        }
      </p>
      
      {selectedBuilder?.id && (
        <PhotoCapture
          builder={selectedBuilder}
          onSuccess={onBuilderDetected}
        />
      )}
    </div>
  );
};

export default PhotoCaptureSection;
