
import { useAttendanceSystem } from '@/hooks/useAttendanceSystem';
import { useEffect, useState } from 'react';
import IndexLayout from '@/components/home/IndexLayout';
import IndexContent from '@/components/home/IndexContent';
import { getBuilders } from '@/utils/builders/getBuilders';
import { Builder } from '@/components/builder/types';
import { useQuery } from '@tanstack/react-query';

const Index = () => {
  const {
    isCameraActive,
    detectedBuilder,
    selectedBuilder,
    showIntro,
    handleBuilderDetected,
    handleSelectBuilder,
    startAttendance,
    reset
  } = useAttendanceSystem();

  // Fetch all builders
  const { data: builders = [] } = useQuery({
    queryKey: ['builders'],
    queryFn: getBuilders
  });

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
