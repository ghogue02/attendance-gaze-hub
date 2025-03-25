
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { Builder } from '@/components/builder/types';
import SimpleAttendanceCamera from '@/components/SimpleAttendanceCamera';
import BuilderResult from './BuilderResult';

interface CameraSectionProps {
  isCameraActive: boolean;
  detectedBuilder: Builder | null;
  selectedBuilder: Builder | null;
  onBuilderDetected: (builder: Builder) => void;
}

const CameraSection = ({
  isCameraActive,
  detectedBuilder,
  selectedBuilder,
  onBuilderDetected
}: CameraSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card p-4 md:p-6"
    >
      {isCameraActive ? (
        <SimpleAttendanceCamera 
          onAttendanceMarked={onBuilderDetected}
          isCameraActive={isCameraActive}
          selectedBuilder={selectedBuilder}
        />
      ) : detectedBuilder ? (
        <BuilderResult detectedBuilder={detectedBuilder} />
      ) : (
        <InactiveCameraState />
      )}
    </motion.div>
  );
};

const InactiveCameraState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Camera size={40} className="text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Photo Capture</h3>
      <p className="text-muted-foreground max-w-xs mb-4">
        Find your name, then take a photo
      </p>
    </div>
  );
};

export default CameraSection;
