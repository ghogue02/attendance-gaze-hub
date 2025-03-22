
import { Users, ListCheck } from 'lucide-react';

interface RegisterInstructionsProps {
  buildersCount: number;
  registeredCount: number;
}

export const RegisterInstructions = ({ buildersCount, registeredCount }: RegisterInstructionsProps) => {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 md:flex md:gap-8 max-w-md mx-auto">
      <div className="glass-card p-4 flex-1 flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <Users size={20} />
        </div>
        <span className="text-2xl font-bold">{buildersCount}</span>
        <span className="text-xs text-muted-foreground">Total Builders</span>
      </div>
      
      <div className="glass-card p-4 flex-1 flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <ListCheck size={20} />
        </div>
        <span className="text-2xl font-bold">{registeredCount}</span>
        <span className="text-xs text-muted-foreground">Registered Faces</span>
      </div>
    </div>
  );
};
