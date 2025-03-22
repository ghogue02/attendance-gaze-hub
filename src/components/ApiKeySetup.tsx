
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';

interface ApiKeySetupProps {
  onSetup: () => void;
}

const API_KEY_STORAGE_KEY = 'faceRecognition_apiKey';

const ApiKeySetup = ({ onSetup }: ApiKeySetupProps) => {
  const [apiKey, setApiKey] = useState('');
  const [open, setOpen] = useState(true);
  
  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    
    // Save API key to local storage (in a real app, use a more secure method)
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    
    // Since AI enhancement is removed, we don't need to initialize any service
    
    toast.success('API key saved successfully');
    setOpen(false);
    onSetup();
  };
  
  const handleSkip = () => {
    toast.info('Enhanced avatar generation will not be available without an API key');
    setOpen(false);
    onSetup();
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setup AI-Enhanced Avatars</DialogTitle>
          <DialogDescription>
            Enter your Runware API key to enable AI-enhanced avatar generation.
            You can get an API key from the Runware dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">
            Runware API Key
          </label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Runware API key"
            className="mb-4"
          />
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button onClick={handleSaveApiKey}>
              Save API Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const initializeApiKey = (): string | null => {
  // Check if API key exists in local storage
  const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  
  // Since we've removed the AI service initialization, we'll just return the API key
  return storedApiKey;
};

export default ApiKeySetup;
