
import { motion } from 'framer-motion';
import StudentCard, { Student } from '@/components/StudentCard';

interface StudentsListProps {
  isLoading: boolean;
  filteredStudents: Student[];
  searchQuery: string;
  onClearFilters: () => void;
  onVerify: (studentId: string) => void;
}

const StudentsList = ({ 
  isLoading, 
  filteredStudents,
  searchQuery,
  onClearFilters,
  onVerify
}: StudentsListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading student data...</p>
        </div>
      </div>
    );
  }
  
  if (filteredStudents.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <h3 className="text-xl font-medium mb-2">No students found</h3>
        <p className="text-muted-foreground mb-4">
          {searchQuery 
            ? `No results matching "${searchQuery}"` 
            : "There are no students with the selected status"}
        </p>
        <button 
          onClick={onClearFilters}
          className="btn-secondary py-2 mx-auto"
        >
          Clear filters
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredStudents.map((student) => (
        <motion.div
          key={student.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <StudentCard 
            student={student} 
            onVerify={() => onVerify(student.id)} 
          />
        </motion.div>
      ))}
    </div>
  );
};

export default StudentsList;
