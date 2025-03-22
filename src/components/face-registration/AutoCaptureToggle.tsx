
import { AutoCaptureProps } from './types';

export const AutoCaptureToggle = ({ isActive, onToggle }: AutoCaptureProps) => {
  return (
    <div className="flex items-center justify-between bg-background/80 p-3 rounded-lg shadow-sm border border-muted">
      <span className="text-sm font-medium">Auto-capture: </span>
      <div className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          value="" 
          className="sr-only peer" 
          checked={isActive}
          onChange={onToggle}
          id="auto-capture-toggle"
        />
        <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        <label htmlFor="auto-capture-toggle" className="ml-2 text-sm text-muted-foreground cursor-pointer">
          {isActive ? "On" : "Off"}
        </label>
      </div>
    </div>
  );
};
