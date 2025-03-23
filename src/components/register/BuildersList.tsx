
import { useState, useEffect } from 'react';
import { Check, AlertCircle, Clock } from 'lucide-react';
import { Builder } from '@/components/BuilderCard';
import BuilderCard from '@/components/BuilderCard';
import { Button } from '@/components/ui/button';

interface BuildersListProps {
  builders: Builder[];
  filteredBuilders: Builder[];
  searchQuery: string;
  loading: boolean;
  registrationStatus: {[key: string]: {completed: boolean, count: number}};
  onStartRegistration: (builder: Builder) => void;
  onClearSearch: () => void;
}

export const BuildersList = ({
  builders,
  filteredBuilders,
  searchQuery,
  loading,
  registrationStatus,
  onStartRegistration,
  onClearSearch
}: BuildersListProps) => {
  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading builders...</p>
      </div>
    );
  }
  
  if (filteredBuilders.length === 0) {
    return (
      <div className="text-center py-10 glass-card">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-lg font-medium">No builders found</p>
        <p className="text-sm text-muted-foreground">No results match your search criteria.</p>
        {searchQuery && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={onClearSearch}
          >
            Clear Search
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {filteredBuilders.map(builder => (
        <div key={builder.id} className="glass-card p-4">
          <BuilderCard builder={builder} />
          
          <div className="mt-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Registration Status:</span>
              {registrationStatus[builder.id]?.completed ? (
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
                  <Check size={14} className="mr-1" />
                  Complete
                </span>
              ) : registrationStatus[builder.id]?.count > 0 ? (
                <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  {registrationStatus[builder.id]?.count}/5 Angles
                </span>
              ) : (
                <span className="text-sm bg-yellow-50 text-yellow-600 px-2 py-1 rounded-full flex items-center">
                  <Clock size={14} className="mr-1" />
                  Pending
                </span>
              )}
            </div>
            
            <Button
              onClick={() => onStartRegistration(builder)}
              variant={registrationStatus[builder.id]?.completed ? "outline" : "default"}
              className="w-full mt-2"
            >
              {registrationStatus[builder.id]?.completed ? "Update Face Data" : "Register Face"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
