
import { motion } from 'framer-motion';
import { Builder } from '@/components/BuilderCard';
import CameraSection from './CameraSection';
import { AttendanceSection } from './AttendanceSection';

interface IndexContentProps {
  isCameraActive: boolean;
  detectedBuilder: Builder | null;
  selectedBuilder: Builder | null;
  builders: Builder[];
  startAttendance: () => void;
  handleBuilderDetected: (builder: Builder) => void;
  handleSelectBuilder: (builder: Builder) => void;
  reset: () => void;
}

const IndexContent = ({ 
  isCameraActive, 
  detectedBuilder,
  selectedBuilder,
  builders,
  startAttendance, 
  handleBuilderDetected, 
  handleSelectBuilder,
  reset 
}: IndexContentProps) => {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AttendanceSection 
          isCameraActive={isCameraActive}
          detectedBuilder={detectedBuilder}
          startAttendance={startAttendance}
          reset={reset}
          onSelectBuilder={handleSelectBuilder}
          builders={builders}
        />
      </motion.div>
      
      <CameraSection
        isCameraActive={isCameraActive}
        detectedBuilder={detectedBuilder}
        selectedBuilder={selectedBuilder}
        onBuilderDetected={handleBuilderDetected}
      />
    </div>
  );
};

export default IndexContent;
