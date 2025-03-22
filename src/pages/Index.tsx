
import { useState } from 'react';
import Header from '@/components/Header';
import { StatsSection } from '@/components/home/StatsSection';
import { AttendanceSection } from '@/components/home/AttendanceSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { RecognitionResult } from '@/components/home/RecognitionResult';
import { useAttendanceSystem } from '@/hooks/useAttendanceSystem';
import { motion } from 'framer-motion';

const Index = () => {
  const {
    isCameraActive,
    detectedBuilder,
    showIntro,
    passiveMode,
    setPassiveMode,
    handleBuilderDetected,
    startAttendance,
    reset
  } = useAttendanceSystem();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/50">
      <Header />
      
      <main className="pt-24 pb-16 px-4 container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="section-subtitle inline-block mb-2">Modern Attendance Solution</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            FaceID Attendance System
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            The simplest way to track builder attendance using advanced facial recognition technology.
            Fast, accurate, and secure.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center mt-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col space-y-6"
          >
            {showIntro ? (
              <>
                <StatsSection />
                <HowItWorksSection passiveMode={passiveMode} />
                <AttendanceSection 
                  passiveMode={passiveMode}
                  setPassiveMode={setPassiveMode}
                  startAttendance={startAttendance}
                />
              </>
            ) : detectedBuilder ? (
              <RecognitionResult
                detectedBuilder={detectedBuilder}
                passiveMode={passiveMode}
                reset={reset}
              />
            ) : (
              <AttendanceInstructionsSection
                passiveMode={passiveMode}
                setPassiveMode={setPassiveMode}
                setIsCameraActive={() => reset()}
              />
            )}
          </motion.div>
          
          <CameraView 
            isCameraActive={isCameraActive} 
            detectedBuilder={detectedBuilder}
            passiveMode={passiveMode}
            onBuilderDetected={handleBuilderDetected}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
