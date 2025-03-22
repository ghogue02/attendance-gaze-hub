
import { motion } from 'framer-motion';
import { UserCheck, UserX, Clock } from 'lucide-react';

export type StudentStatus = 'present' | 'absent' | 'pending';

export interface Student {
  id: string;
  name: string;
  studentId: string;
  status: StudentStatus;
  timeRecorded?: string;
  image?: string;
}

interface StudentCardProps {
  student: Student;
  onVerify?: () => void;
}

const StudentCard = ({ student, onVerify }: StudentCardProps) => {
  const getStatusColor = (status: StudentStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'absent':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: StudentStatus) => {
    switch (status) {
      case 'present':
        return <UserCheck className="w-4 h-4" />;
      case 'absent':
        return <UserX className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-5 transition-all duration-300 hover:shadow-glass-lg"
    >
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-secondary flex-shrink-0 shadow-sm">
          {student.image ? (
            <img
              src={student.image}
              alt={student.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
              {student.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-semibold text-lg">{student.name}</h3>
          <p className="text-sm text-foreground/70 mb-2">ID: {student.studentId}</p>
          
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
            {getStatusIcon(student.status)}
            <span className="ml-1 capitalize">{student.status}</span>
          </div>
          
          {student.timeRecorded && (
            <p className="text-xs text-foreground/60 mt-2">
              {student.status === 'present' ? 'Recorded at: ' : 'Last check: '}
              {student.timeRecorded}
            </p>
          )}
        </div>
        
        {onVerify && (
          <button
            onClick={onVerify}
            className="btn-primary text-sm py-2 px-4 mt-3 sm:mt-0"
          >
            Verify
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default StudentCard;
