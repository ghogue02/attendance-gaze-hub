
import { useState } from 'react';
import { Builder } from '@/components/builder/types';

export const useAttendanceSystem = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedBuilder, setDetectedBuilder] = useState<Builder | null>(null);
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const handleBuilderDetected = (builder: Builder) => {
    setDetectedBuilder(builder);
    setSelectedBuilder(null);
    
    // Automatically close camera after detection
    setTimeout(() => {
      setIsCameraActive(false);
    }, 1000);
  };

  const startAttendance = () => {
    setShowIntro(false);
    setIsCameraActive(true);
  };

  const handleSelectBuilder = (builder: Builder) => {
    setSelectedBuilder(builder);
    setDetectedBuilder(null);
    // Camera will be activated via useEffect in IndexContent
  };

  const reset = () => {
    setDetectedBuilder(null);
    setSelectedBuilder(null);
    setIsCameraActive(false);
    setShowIntro(true);
  };

  return {
    isCameraActive,
    detectedBuilder,
    selectedBuilder,
    showIntro,
    handleBuilderDetected,
    handleSelectBuilder,
    startAttendance,
    reset
  };
};
