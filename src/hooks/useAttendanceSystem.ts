
import { useState } from 'react';
import { toast } from 'sonner';
import { Builder } from '@/components/BuilderCard';

export const useAttendanceSystem = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedBuilder, setDetectedBuilder] = useState<Builder | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [passiveMode, setPassiveMode] = useState(false);

  const handleBuilderDetected = (builder: Builder) => {
    setDetectedBuilder(builder);
    
    // Don't automatically close camera in passive mode
    if (!passiveMode) {
      setTimeout(() => {
        setIsCameraActive(false);
      }, 1000);
    }
  };

  const startAttendance = () => {
    setShowIntro(false);
    setDetectedBuilder(null);
    setIsCameraActive(true);
  };

  const reset = () => {
    setDetectedBuilder(null);
    setIsCameraActive(false);
    setShowIntro(true);
    setPassiveMode(false);
  };

  return {
    isCameraActive,
    detectedBuilder,
    showIntro,
    passiveMode,
    setPassiveMode,
    handleBuilderDetected,
    startAttendance,
    reset
  };
};
