
export interface DailyAttendance {
  name: string;
  date: string;
  Present: number;
  Late: number;
  Absent: number;
  Excused: number;
}

export interface AttendanceChartHookResult {
  chartData: DailyAttendance[];
  isLoading: boolean;
}
