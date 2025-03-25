
export type BuilderStatus = 'present' | 'absent' | 'excused' | 'pending';

export interface Builder {
  id: string;
  name: string;
  builderId: string;
  status: BuilderStatus;
  timeRecorded?: string;
  image?: string;
  excuseReason?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: BuilderStatus;
  timeRecorded?: string;
  excuseReason?: string;
}

export interface BuilderCardProps {
  builder: Builder;
  onVerify?: (builderId: string, status: BuilderStatus, reason?: string) => void;
}
