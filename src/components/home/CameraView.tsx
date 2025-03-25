
import { Camera, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import AttendanceCamera from '@/components/AttendanceCamera';
import { Builder } from '@/components/builder/types';

interface CameraViewProps {
  isCameraActive: boolean;
  detectedBuilder: Builder | null;
  passiveMode: boolean;
  onBuilderDetected: (builder: Builder) => void;
}

export const CameraView = ({ 
  isCameraActive, 
  detectedBuilder, 
  passiveMode, 
  onBuilderDetected 
}: CameraViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card p-4 md:p-8"
    >
      {isCameraActive ? (
        <AttendanceCamera 
          onBuilderDetected={onBuilderDetected}
          isCameraActive={isCameraActive}
          passive={passiveMode}
          passiveInterval={1000} // Reduced to 1 second for faster scanning
        />
      ) : detectedBuilder ? (
        <div className="flex flex-col items-center justify-center h-full py-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4"
          >
            {detectedBuilder.image ? (
              <img 
                src={detectedBuilder.image} 
                alt={detectedBuilder.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                {detectedBuilder.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </motion.div>
          <h3 className="text-2xl font-bold">{detectedBuilder.name}</h3>
          <p className="text-muted-foreground">ID: {detectedBuilder.builderId}</p>
          <div className="mt-4 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Attendance recorded at {detectedBuilder.timeRecorded}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Camera size={40} className="text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Face Recognition</h3>
          <p className="text-muted-foreground max-w-xs mb-6">
            {passiveMode 
              ? "Toggle passive mode to start camera automatically" 
              : "Click the button to activate the camera and start the attendance process"}
          </p>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-muted-foreground opacity-60"
          >
            <ChevronDown size={24} />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
