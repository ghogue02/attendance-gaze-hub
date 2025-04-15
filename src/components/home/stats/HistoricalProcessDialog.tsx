
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { processHistoricalAttendance } from '@/utils/attendance/processing/historicalProcessor';

interface HistoricalProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HistoricalProcessDialog = ({ open, onOpenChange }: HistoricalProcessDialogProps) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleHistoricalProcess = async (startDateStr: string, endDateStr: string) => {
    try {
      setIsProcessing(true);
      console.log(`Processing historical attendance from ${startDateStr} to ${endDateStr}`);
      
      const result = await processHistoricalAttendance(startDateStr, endDateStr);
      
      toast.success(`Historical attendance processed: Updated ${result.updated} pending records and created ${result.created} absent records`);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error processing historical attendance:', error);
      toast.error('Failed to process historical attendance');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Historical Attendance</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            This will mark all pending attendance as absent and create absent records for students with no attendance record for the specified date range.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="text-sm font-medium">
                Start Date
              </label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="end-date" className="text-sm font-medium">
                End Date
              </label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleHistoricalProcess(startDate, endDate)}
            disabled={isProcessing || !startDate || !endDate}
          >
            {isProcessing ? 'Processing...' : 'Process'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricalProcessDialog;
