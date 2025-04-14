
import { useCallback } from 'react';
import { trackRequest } from '@/utils/debugging/requestTracker';
import IndexLayout from '@/components/home/IndexLayout';
import { useHomeData } from '@/hooks/useHomeData';
import BuilderSearchSection from '@/components/home/BuilderSearchSection';
import PhotoCaptureSection from '@/components/home/PhotoCaptureSection';
import { RecognitionResult } from '@/components/home/RecognitionResult'; // Changed to named import
import PresentBuildersCarousel from '@/components/home/PresentBuildersCarousel';
import LoadingState from '@/components/home/LoadingState';

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
      return <PresentBuildersCarousel initialBuilders={builders} />;
    }
    return null;
  }, [loading, builders]);

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
