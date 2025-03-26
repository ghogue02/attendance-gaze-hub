
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { BuilderStatus } from "@/components/builder/types";
import { Search, ArrowUpDown } from "lucide-react";

interface BuilderFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: BuilderStatus | 'all';
  setStatusFilter: (status: BuilderStatus | 'all') => void;
  sortOption: string;
  setSortOption: (option: string) => void;
}

const BuilderFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortOption,
  setSortOption
}: BuilderFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 mt-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select 
        value={statusFilter} 
        onValueChange={(value) => setStatusFilter(value as BuilderStatus | 'all')}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="present">Present</SelectItem>
          <SelectItem value="absent">Absent</SelectItem>
          <SelectItem value="excused">Excused Absence</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="late">Late</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={sortOption} 
        onValueChange={setSortOption}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name (A-Z)</SelectItem>
          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          <SelectItem value="attendance">Attendance % (High-Low)</SelectItem>
          <SelectItem value="attendance-desc">Attendance % (Low-High)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default BuilderFilters;
