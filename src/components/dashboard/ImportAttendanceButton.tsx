
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { runAttendanceImport } from '@/utils/attendance/runImport';
import { RefreshCw } from 'lucide-react';

const ImportAttendanceButton = ({ onComplete }: { onComplete?: () => void }) => {
  const [isImporting, setIsImporting] = useState(false);
  
  const handleImport = async () => {
    try {
      setIsImporting(true);
      toast.info('Starting historical attendance import...');
      
      const result = await runAttendanceImport();
      
      if (result) {
        toast.success('Historical attendance data imported successfully');
        if (onComplete) {
          onComplete();
        }
      } else {
        toast.error('Failed to import some or all historical attendance data');
      }
    } catch (error) {
      console.error('Error importing attendance data:', error);
      toast.error('An error occurred during the import process');
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Button 
      onClick={handleImport} 
      disabled={isImporting}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isImporting ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Importing...</span>
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          <span>Import Historical Data</span>
        </>
      )}
    </Button>
  );
};

export default ImportAttendanceButton;
