
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CohortName } from '@/types/cohort';

interface CohortSelectorProps {
  selectedCohort: CohortName;
  onCohortChange: (cohort: CohortName) => void;
}

const CohortSelector = ({ selectedCohort, onCohortChange }: CohortSelectorProps) => {
  const cohortOptions: { value: CohortName; label: string }[] = [
    { value: 'All Cohorts', label: 'All Cohorts' },
    { value: 'March 2025 Pilot', label: 'March 2025 Pilot' },
    { value: 'June 2025', label: 'June 2025' }
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Cohort:</span>
      <Select value={selectedCohort} onValueChange={onCohortChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select cohort" />
        </SelectTrigger>
        <SelectContent>
          {cohortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CohortSelector;
