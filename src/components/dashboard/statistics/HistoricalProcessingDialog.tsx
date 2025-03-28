
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { processHistoricalAttendance } from '@/utils/attendance/markAttendance';

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');
const MINIMUM_DATE_STRING = MINIMUM_DATE.toISOString().split('T')[0];

interface HistoricalProcessingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HistoricalProcessingDialog = ({ isOpen, onClose }: HistoricalProcessingDialogProps) => {
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    
    // Ensure default start date is not before MINIMUM_DATE
    return date < MINIMUM_DATE 
      ? MINIMUM_DATE_STRING
      : date.toISOString().split('T')[0];
  }

  const handleHistoricalProcess = async (startDateStr: string, endDateStr: string) => {
    try {
      // Validate that start date is not before MINIMUM_DATE
      const startDateObj = new Date(startDateStr);
      if (startDateObj < MINIMUM_DATE) {
        toast.error(`Start date cannot be before ${MINIMUM_DATE_STRING}`);
        return;
      }
      
      setIsProcessing(true);
      console.log(`Processing historical attendance from ${startDateStr} to ${endDateStr}`);
      
      const result = await processHistoricalAttendance(startDateStr, endDateStr);
      
      toast.success(`Historical attendance processed: Updated ${result.updated} pending records and created ${result.created} absent records`);
      onClose();
      
    } catch (error) {
      console.error('Error processing historical attendance:', error);
      toast.error('Failed to process historical attendance');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Historical Attendance</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            This will mark all pending attendance as absent and create absent records for students with no attendance record for the specified date range.
          </p>
          <p className="text-sm text-muted-foreground font-medium">
            Note: Date range cannot start before {MINIMUM_DATE_STRING}
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
                min={MINIMUM_DATE_STRING}
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
                min={MINIMUM_DATE_STRING}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleHistoricalProcess(startDate, endDate)}
            disabled={isProcessing || !startDate || !endDate || new Date(startDate) < MINIMUM_DATE}
          >
            {isProcessing ? 'Processing...' : 'Process'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricalProcessingDialog;
