
import { motion } from 'framer-motion';

export const CarouselEmpty = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 pb-8 w-full"
    >
      <div className="glass-card p-4 rounded-lg">
        <h2 className="text-center text-xl font-semibold mb-4">Present Today</h2>
        <p className="text-center text-muted-foreground">No builders are present yet</p>
      </div>
    </motion.div>
  );
};

export default CarouselEmpty;
