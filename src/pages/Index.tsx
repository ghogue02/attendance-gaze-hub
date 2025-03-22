
import { useAttendanceSystem } from '@/hooks/useAttendanceSystem';
import IndexLayout from '@/components/home/IndexLayout';
import IndexContent from '@/components/home/IndexContent';
import AttendanceOptions from '@/components/home/AttendanceOptions';

const Index = () => {
  const {
    isCameraActive,
    detectedBuilder,
    showIntro,
    passiveMode,
    debugMode,
    setPassiveMode,
    toggleDebugMode,
    handleBuilderDetected,
    startAttendance,
    reset
  } = useAttendanceSystem();

  return (
    <IndexLayout>
      <IndexContent
        isCameraActive={isCameraActive}
        detectedBuilder={detectedBuilder}
        passiveMode={passiveMode}
        debugMode={debugMode}
        setPassiveMode={setPassiveMode}
        toggleDebugMode={toggleDebugMode}
        handleBuilderDetected={handleBuilderDetected}
        startAttendance={startAttendance}
        reset={reset}
      />
      <AttendanceOptions
        passiveMode={passiveMode}
        setPassiveMode={setPassiveMode}
        startAttendance={startAttendance}
      />
    </IndexLayout>
  );
};

export default Index;
