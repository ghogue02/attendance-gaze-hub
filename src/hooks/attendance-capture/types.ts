
import { BuilderStatus } from '@/components/builder/types';

export interface AttendanceData {
  builderId: string;
  status: BuilderStatus;
  excuseReason?: string;
  notes?: string;
  date: string;
}

export interface AttendanceNavigationState {
  activeTab?: string;
  highlightBuilderId?: string;
}
