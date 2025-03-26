
import { motion } from 'framer-motion';
import { Builder, BuilderStatus } from '@/components/builder/types';
import { DeleteBuilderDialog } from '@/components/builder/DeleteBuilderDialog';
import { useState } from 'react';
import { BuilderCard } from '@/components/builder';

interface BuildersListProps {
  isLoading: boolean;
  filteredBuilders: Builder[];
  searchQuery: string;
  onClearFilters: () => void;
  onVerify: (builderId: string, status: BuilderStatus, reason?: string) => void;
  onDeleteRequest: (builderId: string, builderName: string) => void;
}

const BuildersList = ({ 
  isLoading, 
  filteredBuilders,
  searchQuery,
  onClearFilters,
  onVerify,
  onDeleteRequest
}: BuildersListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading builder data...</p>
        </div>
      </div>
    );
  }
  
  if (filteredBuilders.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <h3 className="text-xl font-medium mb-2">No builders found</h3>
        <p className="text-muted-foreground mb-4">
          {searchQuery 
            ? `No results matching "${searchQuery}"` 
            : "There are no builders with the selected status"}
        </p>
        <button 
          onClick={onClearFilters}
          className="btn-secondary py-2 mx-auto"
        >
          Clear filters
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredBuilders.map((builder) => (
        <motion.div
          key={builder.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <BuilderCard 
            builder={builder} 
            onVerify={onVerify}
            onDeleteRequest={() => onDeleteRequest(builder.id, builder.name)} 
          />
        </motion.div>
      ))}
    </div>
  );
};

export default BuildersList;
