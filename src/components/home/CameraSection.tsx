
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { Builder } from '@/components/BuilderCard';
import AttendanceCamera from '@/components/AttendanceCamera';
import BuilderResult from './BuilderResult';

interface CameraSectionProps {
  isCameraActive: boolean;
  detectedBuilder: Builder | null;
  passiveMode: boolean;
  onBuilderDetected: (builder: Builder) => void;
}

const CameraSection = ({
  isCameraActive,
  detectedBuilder,
  passiveMode,
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
        <AttendanceCamera 
          onBuilderDetected={onBuilderDetected}
          isCameraActive={isCameraActive}
          passive={passiveMode}
          passiveInterval={2000}
        />
      ) : detectedBuilder ? (
        <BuilderResult detectedBuilder={detectedBuilder} />
      ) : (
        <InactiveCameraState passiveMode={passiveMode} />
      )}
    </motion.div>
  );
};

const InactiveCameraState = ({ passiveMode }: { passiveMode: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Camera size={40} className="text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Face Recognition</h3>
      <p className="text-muted-foreground max-w-xs mb-4">
        {passiveMode 
          ? "Click Start Face Recognition to begin passive scanning" 
          : "Click Start Face Recognition to activate the camera and check in"}
      </p>
    </div>
  );
};

export default CameraSection;
