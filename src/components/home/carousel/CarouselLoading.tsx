
import { motion } from 'framer-motion';

export const CarouselLoading = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 pb-8 w-full"
    >
      <div className="glass-card p-4 rounded-lg">
        <h2 className="text-center text-xl font-semibold mb-4">Present Today</h2>
        <div className="flex justify-center py-6">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      </div>
    </motion.div>
  );
};

export default CarouselLoading;
