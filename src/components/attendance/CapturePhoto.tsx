
import { Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Builder } from '@/components/builder/types';
import { useState } from 'react';

interface CapturePhotoProps {
  isCapturing: boolean;
  selectedBuilder: Builder | null;
  onCapture: () => void;
  error?: string | null;
  processing?: boolean;
}

const CapturePhoto = ({
  isCapturing,
  selectedBuilder,
  onCapture,
  error = null,
  processing = false
}: CapturePhotoProps) => {
  const isReady = isCapturing && selectedBuilder && !processing;
  
  return (
    <div className="flex flex-col space-y-4">
      {/* Selected builder info */}
      {selectedBuilder && (
        <div className="bg-secondary/40 p-3 rounded-lg flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {selectedBuilder.image ? (
              <img 
                src={selectedBuilder.image} 
                alt={selectedBuilder.name}
                className="h-full w-full object-cover"
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
      
      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 p-3 rounded-lg flex items-start gap-2 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
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
        {processing ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        ) : (
          <>
            <Camera size={20} />
            Take Photo
          </>
        )}
      </Button>
    </div>
  );
};

export default CapturePhoto;
