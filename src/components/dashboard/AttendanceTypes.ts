
import { BuilderStatus } from '@/components/builder/types';

export interface AttendanceRecord {
  id: string;
  date: string;
  status: BuilderStatus;
  timeRecorded?: string;
  notes?: string;
  excuseReason?: string;
  studentId?: string;
  studentName?: string;
}

export interface AttendanceChartData {
  date: string;
  present: number;
  absent: number;
  excused: number;
  pending: number;
  total: number;
}

export interface DateSelectorProps {
  selectedDate: string;
  onChange: (date: string) => void;
}
