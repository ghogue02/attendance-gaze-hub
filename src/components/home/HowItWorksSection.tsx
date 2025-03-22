
interface HowItWorksSectionProps {
  passiveMode: boolean;
}

export const HowItWorksSection = ({ passiveMode }: HowItWorksSectionProps) => {
  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold mb-3">How It Works</h2>
      <ol className="space-y-4 text-sm">
        <li className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
            1
          </div>
          <div>
            <span className="font-medium">Register your face</span>
            <p className="text-muted-foreground mt-1">Builders need to register their face before using the system.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
            2
          </div>
          <div>
            <span className="font-medium">Activate the camera</span>
            <p className="text-muted-foreground mt-1">
              {passiveMode 
                ? "Passive mode automatically scans for faces" 
                : "Click the button below to start the facial recognition process"}
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
            3
          </div>
          <div>
            <span className="font-medium">Verification complete</span>
            <p className="text-muted-foreground mt-1">Your attendance is recorded instantly in the system.</p>
          </div>
        </li>
      </ol>
    </div>
  );
};
