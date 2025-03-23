
import React from 'react';
import { AttendanceSection } from './AttendanceSection';
import AttendanceOptions from './AttendanceOptions';
import CameraSection from './CameraSection';
import { Builder } from '@/components/BuilderCard';
import { Button } from '@/components/ui/button';

interface IndexContentProps {
  isCameraActive: boolean;
  detectedBuilder: Builder | null;
  passiveMode: boolean;
  debugMode?: boolean;
  setPassiveMode: (passive: boolean) => void;
  toggleDebugMode?: () => void;
  handleBuilderDetected: (builder: Builder) => void;
  startAttendance: () => void;
  reset: () => void;
}

const IndexContent = ({
  isCameraActive,
  detectedBuilder,
  passiveMode,
  debugMode = true,
  setPassiveMode,
  toggleDebugMode,
  handleBuilderDetected,
  startAttendance,
  reset
}: IndexContentProps) => {
  return (
    <div className="space-y-6 py-8">
      <div className="grid grid-cols-1 gap-6">
        <AttendanceSection 
          isCameraActive={isCameraActive}
          detectedBuilder={detectedBuilder}
          startAttendance={startAttendance}
          reset={reset}
        />
        
        <CameraSection 
          isCameraActive={isCameraActive}
          detectedBuilder={detectedBuilder}
          passiveMode={passiveMode}
          debugMode={debugMode}
          onBuilderDetected={handleBuilderDetected}
          toggleDebugMode={toggleDebugMode}
        />
      </div>
    </div>
  );
};

export default IndexContent;
