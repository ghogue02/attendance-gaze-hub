
import { useState, useEffect } from 'react';
import { trackRequest } from '@/utils/debugging/requestTracker';
import { getCurrentDateString } from '@/utils/date/dateUtils';
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

  return (
    <div className="min-h-screen bg-background">
      <IndexLayout>
        {loading ? (
          <LoadingState />
        ) : detectedBuilder ? (
          <RecognitionResult 
            detectedBuilder={detectedBuilder} 
            passiveMode={false} 
            reset={handleReset} 
          />
        ) : (
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
        )}
        
        {!loading && <PresentBuildersCarousel initialBuilders={builders} />}
      </IndexLayout>
    </div>
  );
};

export default Home;
