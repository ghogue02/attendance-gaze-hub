
import { motion } from 'framer-motion';
import { Builder } from '@/components/BuilderCard';

interface BuilderResultProps {
  detectedBuilder: Builder;
}

const BuilderResult = ({ detectedBuilder }: BuilderResultProps) => {
  return (
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
  );
};

export default BuilderResult;
