
export interface Cohort {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CohortName = 'March 2025 Pilot' | 'June 2025' | 'All Cohorts';
