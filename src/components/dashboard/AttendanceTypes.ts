
import { BuilderStatus } from '@/components/builder/types';

export interface AttendanceRecord {
  id: string;
  date: string;
  studentName: string;
  studentId: string;
  status: BuilderStatus;
  timeRecorded: string | null;
  notes: string | null;
  excuseReason: string | null;
}
