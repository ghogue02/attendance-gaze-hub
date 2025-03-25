
import { useAttendanceSystem } from '@/hooks/useAttendanceSystem';
import { useEffect, useState } from 'react';
import IndexLayout from '@/components/home/IndexLayout';
import IndexContent from '@/components/home/IndexContent';
import { getBuilders } from '@/utils/builders/getBuilders';
import { Builder } from '@/components/BuilderCard';
import { useQuery } from '@tanstack/react-query';

const Index = () => {
  const {
    isCameraActive,
    detectedBuilder,
    showIntro,
    handleBuilderDetected,
    startAttendance,
    reset
  } = useAttendanceSystem();

  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);

  // Fetch all builders
  const { data: builders = [] } = useQuery({
    queryKey: ['builders'],
    queryFn: getBuilders
  });

  const handleSelectBuilder = (builder: Builder) => {
    setSelectedBuilder(builder);
  };

  // Reset selected builder when attendance is marked
  useEffect(() => {
    if (detectedBuilder) {
      setSelectedBuilder(null);
    }
  }, [detectedBuilder]);

  return (
    <IndexLayout>
      <IndexContent
        isCameraActive={isCameraActive}
        detectedBuilder={detectedBuilder}
        selectedBuilder={selectedBuilder}
        builders={builders}
        handleBuilderDetected={handleBuilderDetected}
        handleSelectBuilder={handleSelectBuilder}
        startAttendance={startAttendance}
        reset={reset}
      />
    </IndexLayout>
  );
};

export default Index;
