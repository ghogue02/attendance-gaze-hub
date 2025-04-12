
import React, { useMemo, memo } from 'react';
import { Builder, AttendanceStats } from '@/components/builder/types';
import BuilderCard from '@/components/builder/BuilderCard';
import { useBuilderAttendanceRates } from '@/hooks/useBuilderAttendanceRates';

interface SortedBuildersListProps {
  builders: Builder[];
  onVerify?: (builderId: string, status: Builder['status'], reason?: string) => void;
  highlightBuilderId?: string;
  // Add the missing properties that are being passed from BuildersTab
  isLoading?: boolean;
  filteredBuilders?: any[]; // Added the missing filteredBuilders property
  searchQuery?: string;
  sortOption?: string;
  onClearFilters?: () => void;
  onDeleteRequest?: (builderId: string, builderName: string) => void;
  highlightedBuilderRef?: React.RefObject<HTMLDivElement>;
}

const SortedBuildersList = memo(({ 
  builders, 
  onVerify, 
  highlightBuilderId,
  // We can destructure the new props, but we won't use all of them in this component
  // They're just needed to match the interface
  isLoading,
  filteredBuilders, // Destructure the filteredBuilders prop
  searchQuery,
  sortOption,
  onClearFilters,
  onDeleteRequest,
  highlightedBuilderRef
}: SortedBuildersListProps) => {
  // Fetch attendance stats for all builders
  const { builderAttendanceRates, builderAttendanceStats, isLoading: attendanceRatesLoading } = useBuilderAttendanceRates(builders);
  
  // Log to help debug attendance rate issues
  useMemo(() => {
    console.log(`[SortedBuildersList] Rendering with ${builders.length} builders`);
    console.log(`[SortedBuildersList] Attendance stats for first few builders:`, 
      Object.entries(builderAttendanceStats || {}).slice(0, 3));
  }, [builders.length, builderAttendanceStats]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {builders.map((builder) => {
        // Add ref handling for the highlighted builder
        const isHighlighted = highlightBuilderId === builder.id;
        
        return (
          <div 
            key={builder.id}
            ref={isHighlighted && highlightedBuilderRef ? (element) => {
              // Only set ref for the highlighted builder
              if (isHighlighted && element && highlightedBuilderRef) {
                (highlightedBuilderRef as React.MutableRefObject<HTMLDivElement | null>).current = element;
              }
            } : undefined}
            className={isHighlighted ? 'highlight-card' : ''}
          >
            <BuilderCard 
              builder={builder} 
              onVerify={onVerify} 
              attendanceStats={builderAttendanceStats?.[builder.id] || null}
              onDeleteRequest={onDeleteRequest ? () => onDeleteRequest(builder.id, builder.name) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
});

SortedBuildersList.displayName = 'SortedBuildersList';

export default SortedBuildersList;
