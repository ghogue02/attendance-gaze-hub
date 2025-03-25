
import { Builder } from '@/components/BuilderCard';
import AttendanceCapture from './attendance/AttendanceCapture';

interface SimpleAttendanceCameraProps {
  onAttendanceMarked: (builder: Builder) => void;
  isCameraActive: boolean;
  selectedBuilder?: Builder | null;
}

const SimpleAttendanceCamera = ({
  onAttendanceMarked,
  isCameraActive,
  selectedBuilder = null
}: SimpleAttendanceCameraProps) => {
  return (
    <AttendanceCapture
      onAttendanceMarked={onAttendanceMarked}
      isCameraActive={isCameraActive}
      selectedBuilder={selectedBuilder}
    />
  );
};

export default SimpleAttendanceCamera;
