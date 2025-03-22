
import { Builder } from '@/components/BuilderCard';
import { RecognitionResult } from '@/components/home/RecognitionResult';
import AttendanceOptions from './AttendanceOptions';
import CameraSection from './CameraSection';

interface IndexContentProps {
  isCameraActive: boolean;
  detectedBuilder: Builder | null;
  passiveMode: boolean;
  setPassiveMode: (value: boolean) => void;
  handleBuilderDetected: (builder: Builder) => void;
  startAttendance: () => void;
  reset: () => void;
}

const IndexContent = ({
  isCameraActive,
  detectedBuilder,
  passiveMode,
  setPassiveMode,
  handleBuilderDetected,
  startAttendance,
  reset
}: IndexContentProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-8 items-center mt-8">
      <div className="flex flex-col space-y-6">
        {detectedBuilder ? (
          <RecognitionResult
            detectedBuilder={detectedBuilder}
            passiveMode={passiveMode}
            reset={reset}
          />
        ) : (
          <AttendanceOptions
            passiveMode={passiveMode}
            setPassiveMode={setPassiveMode}
            startAttendance={startAttendance}
          />
        )}
      </div>
      
      <CameraSection
        isCameraActive={isCameraActive}
        detectedBuilder={detectedBuilder}
        passiveMode={passiveMode}
        onBuilderDetected={handleBuilderDetected}
      />
    </div>
  );
};

export default IndexContent;
