
import { useAttendanceSystem } from '@/hooks/useAttendanceSystem';
import IndexLayout from '@/components/home/IndexLayout';
import IndexContent from '@/components/home/IndexContent';

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
    </IndexLayout>
  );
};

export default Index;
