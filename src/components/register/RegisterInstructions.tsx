
import { Users, ListCheck } from 'lucide-react';

interface RegisterInstructionsProps {
  buildersCount: number;
  registeredCount: number;
}

export const RegisterInstructions = ({ buildersCount, registeredCount }: RegisterInstructionsProps) => {
  return (
    <>
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

      <div className="glass-card p-6 mb-10">
        <h2 className="text-xl font-semibold mb-3">How It Works</h2>
        <ol className="space-y-4 text-sm">
          <li className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
              1
            </div>
            <div>
              <span className="font-medium">Select your profile</span>
              <p className="text-muted-foreground mt-1">Find your name in the list below and click "Register Face"</p>
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
              2
            </div>
            <div>
              <span className="font-medium">Capture from multiple angles</span>
              <p className="text-muted-foreground mt-1">Follow the instructions to capture your face from different angles</p>
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
              3
            </div>
            <div>
              <span className="font-medium">Registration complete</span>
              <p className="text-muted-foreground mt-1">The system can now recognize you automatically for attendance</p>
            </div>
          </li>
        </ol>
      </div>
    </>
  );
};
