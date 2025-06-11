
import { useCallback } from 'react';
import { trackRequest } from '@/utils/debugging/requestTracker';
import IndexLayout from '@/components/home/IndexLayout';
import { useHomeData } from '@/hooks/useHomeData';
import BuilderSearchSection from '@/components/home/BuilderSearchSection';
import PhotoCaptureSection from '@/components/home/PhotoCaptureSection';
import { RecognitionResult } from '@/components/home/RecognitionResult';
import PresentBuildersSection from '@/components/home/PresentBuildersSection';
import LoadingState from '@/components/home/LoadingState';
import HeadshotsCarousel from '@/components/home/HeadshotsCarousel';

const Home = () => {
  const {
    builders,
    loading,
    detectedBuilder,
    selectedBuilder,
    handleBuilderDetected,
    handleSelectBuilder,
    handleReset
  } = useHomeData();

  // Memoize render sections to prevent unnecessary re-renders
  const renderContent = useCallback(() => {
    if (loading) {
      return <LoadingState />;
    }
    
    if (detectedBuilder) {
      return (
        <RecognitionResult 
          detectedBuilder={detectedBuilder} 
          passiveMode={false} 
          reset={handleReset} 
        />
      );
    }
    
    return (
      <div className="space-y-8 w-full">
        <div className="grid md:grid-cols-2 gap-6">
          <BuilderSearchSection 
            builders={builders}
            selectedBuilder={selectedBuilder}
            onSelectBuilder={handleSelectBuilder}
          />
          
          <PhotoCaptureSection
            selectedBuilder={selectedBuilder}
            onBuilderDetected={handleBuilderDetected}
          />
        </div>
      </div>
    );
  }, [loading, detectedBuilder, builders, selectedBuilder, handleReset, handleSelectBuilder, handleBuilderDetected]);

  // Optimize carousel rendering with memoization
  const renderCarousel = useCallback(() => {
    if (!loading) {
      return (
        <>
          <PresentBuildersSection />
          <div className="mt-6">
            <HeadshotsCarousel />
          </div>
        </>
      );
    }
    return null;
  }, [loading]);

  return (
    <div className="min-h-screen bg-background">
      <IndexLayout>
        {renderContent()}
        {renderCarousel()}
      </IndexLayout>
    </div>
  );
};

export default Home;
