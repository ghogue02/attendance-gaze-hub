
import { motion } from 'framer-motion';
import { Builder } from '@/components/builder/types';
import { usePresentBuildersByCohort } from '@/hooks/usePresentBuildersByCohort';
import CarouselLoading from './carousel/CarouselLoading';
import CarouselEmpty from './carousel/CarouselEmpty';
import BuilderCarouselContent from './carousel/BuilderCarouselContent';

const PresentBuildersSection = () => {
  const { pilotCohort, juneCohort, isLoading, error } = usePresentBuildersByCohort();

  if (isLoading) {
    return <CarouselLoading />;
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8 pb-8 w-full"
      >
        <div className="glass-card p-4 rounded-lg">
          <p className="text-center text-destructive">Error loading present builders: {error}</p>
        </div>
      </motion.div>
    );
  }

  const totalPresent = pilotCohort.length + juneCohort.length;

  if (totalPresent === 0) {
    return <CarouselEmpty />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 pb-8 w-full space-y-6"
    >
      {/* Pilot Cohort Section */}
      {pilotCohort.length > 0 && (
        <div className="glass-card p-4 rounded-lg">
          <h2 className="text-center text-xl font-semibold mb-4">
            Pilot Cohort Present Today ({pilotCohort.length})
          </h2>
          <BuilderCarouselContent builders={pilotCohort} />
        </div>
      )}
      
      {/* June Cohort Section */}
      {juneCohort.length > 0 && (
        <div className="glass-card p-4 rounded-lg">
          <h2 className="text-center text-xl font-semibold mb-4">
            June Cohort Present Today ({juneCohort.length})
          </h2>
          <BuilderCarouselContent builders={juneCohort} />
        </div>
      )}
    </motion.div>
  );
};

export default PresentBuildersSection;
