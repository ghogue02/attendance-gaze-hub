
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/builder/types';
import { Skeleton } from '@/components/ui/skeleton';
import BuilderCard from '@/components/builder/BuilderCard';

interface AttendanceHistoryProps {
  builders: Builder[];
  onError: (message: string) => void;
}

const AttendanceHistory = ({ builders, onError }: AttendanceHistoryProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filteredBuilders, setFilteredBuilders] = useState<Builder[]>([]);
  
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      try {
        // Sort builders by date of most recent attendance
        const sorted = [...builders].sort((a, b) => {
          // Sort by status first: present, excused, absent, pending
          const statusOrder = { present: 0, excused: 1, absent: 2, pending: 3, late: 4 };
          const statusA = statusOrder[a.status] || 5;
          const statusB = statusOrder[b.status] || 5;
          
          if (statusA !== statusB) {
            return statusA - statusB;
          }
          
          // Then by name
          return a.name.localeCompare(b.name);
        });
        
        setFilteredBuilders(sorted);
      } catch (error) {
        console.error('Error fetching historical data:', error);
        onError('Failed to load attendance history.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistoricalData();
  }, [builders, onError]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  
  if (filteredBuilders.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No attendance records found.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredBuilders.map(builder => (
        <BuilderCard 
          key={builder.id} 
          builder={builder}
        />
      ))}
    </div>
  );
};

export default AttendanceHistory;
