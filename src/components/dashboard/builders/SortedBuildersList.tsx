
import React, { useMemo, memo } from 'react';
import { Builder } from '@/components/builder/types';
import BuilderCard from '@/components/builder/BuilderCard';
import { useBuilderAttendanceRates } from '@/hooks/useBuilderAttendanceRates';

interface SortedBuildersListProps {
  builders: Builder[];
  onVerify?: (builderId: string, status: Builder['status'], reason?: string) => void;
  highlightBuilderId?: string;
}

const SortedBuildersList = memo(({ builders, onVerify, highlightBuilderId }: SortedBuildersListProps) => {
  // Fetch attendance rates for all builders
  const { builderAttendanceRates, isLoading } = useBuilderAttendanceRates(builders);
  
  // Log to help debug attendance rate issues
  useMemo(() => {
    console.log(`[SortedBuildersList] Rendering with ${builders.length} builders`);
    console.log(`[SortedBuildersList] Attendance rates for first few builders:`, 
      Object.entries(builderAttendanceRates).slice(0, 3));
  }, [builders.length, builderAttendanceRates]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {builders.map((builder) => (
        <div 
          key={builder.id}
          className={highlightBuilderId === builder.id ? 'highlight-card' : ''}
        >
          <BuilderCard 
            builder={builder} 
            onVerify={onVerify} 
            attendanceRate={builderAttendanceRates[builder.id] || null}
          />
        </div>
      ))}
    </div>
  );
});

SortedBuildersList.displayName = 'SortedBuildersList';

export default SortedBuildersList;
