
import { useState } from 'react';
import { Builder } from '@/components/BuilderCard';

export const useAttendanceSystem = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedBuilder, setDetectedBuilder] = useState<Builder | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const handleBuilderDetected = (builder: Builder) => {
    setDetectedBuilder(builder);
    
    // Automatically close camera after detection
    setTimeout(() => {
      setIsCameraActive(false);
    }, 1000);
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
  };

  return {
    isCameraActive,
    detectedBuilder,
    showIntro,
    handleBuilderDetected,
    startAttendance,
    reset
  };
};
