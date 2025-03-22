
import { motion } from 'framer-motion';
import { UserCheck, UserX, Clock } from 'lucide-react';
import UserProfileImage from './dashboard/UserProfileImage';

export type BuilderStatus = 'present' | 'absent' | 'pending';

export interface Builder {
  id: string;
  name: string;
  builderId: string;
  status: BuilderStatus;
  timeRecorded?: string;
  image?: string;
}

interface BuilderCardProps {
  builder: Builder;
  onVerify?: () => void;
}

const BuilderCard = ({ builder, onVerify }: BuilderCardProps) => {
  const getStatusColor = (status: BuilderStatus) => {
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

  const getStatusIcon = (status: BuilderStatus) => {
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
        <UserProfileImage
          userName={builder.name}
          userId={builder.id}
          className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 shadow-sm border-2 border-white/20"
        />
        
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-semibold text-lg">{builder.name}</h3>
          <p className="text-sm text-foreground/70 mb-2">ID: {builder.builderId}</p>
          
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(builder.status)}`}>
            {getStatusIcon(builder.status)}
            <span className="ml-1 capitalize">{builder.status}</span>
          </div>
          
          {builder.timeRecorded && (
            <p className="text-xs text-foreground/60 mt-2">
              {builder.status === 'present' ? 'Recorded at: ' : 'Last check: '}
              {builder.timeRecorded}
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

export default BuilderCard;
