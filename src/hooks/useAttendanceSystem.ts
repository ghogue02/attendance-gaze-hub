
import { useState, useEffect } from 'react';
import { Builder } from '@/components/BuilderCard';

export const useAttendanceSystem = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedBuilder, setDetectedBuilder] = useState<Builder | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [passiveMode, setPassiveMode] = useState(false);

  // Automatically start camera when passive mode is enabled
  useEffect(() => {
    if (passiveMode) {
      startAttendance();
    }
  }, [passiveMode]);

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

  // Custom function to toggle passive mode
  const togglePassiveMode = (value: boolean) => {
    setPassiveMode(value);
    
    // If turning off passive mode and camera is active, close it
    if (!value && isCameraActive) {
      setIsCameraActive(false);
    }
  };

  return {
    isCameraActive,
    detectedBuilder,
    showIntro,
    passiveMode,
    setPassiveMode: togglePassiveMode,
    handleBuilderDetected,
    startAttendance,
    reset
  };
};
