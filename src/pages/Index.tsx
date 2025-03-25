
import { useAttendanceSystem } from '@/hooks/useAttendanceSystem';
import IndexLayout from '@/components/home/IndexLayout';
import IndexContent from '@/components/home/IndexContent';
import AttendanceOptions from '@/components/home/AttendanceOptions';

const Index = () => {
  const {
    isCameraActive,
    detectedBuilder,
    showIntro,
    handleBuilderDetected,
    startAttendance,
    reset
  } = useAttendanceSystem();

  return (
    <IndexLayout>
      <IndexContent
        isCameraActive={isCameraActive}
        detectedBuilder={detectedBuilder}
        handleBuilderDetected={handleBuilderDetected}
        startAttendance={startAttendance}
        reset={reset}
      />
      <AttendanceOptions
        startAttendance={startAttendance}
      />
    </IndexLayout>
  );
};

export default Index;
