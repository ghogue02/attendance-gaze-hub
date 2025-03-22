
import { Search, Filter } from 'lucide-react';
import type { BuilderStatus } from '@/components/BuilderCard';

interface BuilderFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: BuilderStatus | 'all';
  setStatusFilter: (status: BuilderStatus | 'all') => void;
}

const BuilderFilters = ({ 
  searchQuery, 
  setSearchQuery, 
  statusFilter, 
  setStatusFilter 
}: BuilderFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field w-full pl-10"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-muted-foreground" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BuilderStatus | 'all')}
          className="input-field"
        >
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="pending">Pending</option>
        </select>
      </div>
    </div>
  );
};

export default BuilderFilters;
