
import { motion } from 'framer-motion';
import { Builder } from '@/components/builder/types';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { processHistoricalAttendance } from '@/utils/attendance/markAttendance';

interface StatisticsCardsProps {
  builders: Builder[];
}

// Minimum allowed date - Saturday, March 15, 2025
const MINIMUM_DATE = new Date('2025-03-15');
const MINIMUM_DATE_STRING = MINIMUM_DATE.toISOString().split('T')[0];

const StatisticsCards = ({ builders }: StatisticsCardsProps) => {
  const [isHistoricalDialogOpen, setIsHistoricalDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(MINIMUM_DATE_STRING);
  const [endDate, setEndDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Use useMemo to calculate statistics only when builders array changes
  const stats = useMemo(() => {
    const totalBuilders = builders.length;
    const presentCount = builders.filter(s => s.status === 'present').length;
    const absentCount = builders.filter(s => s.status === 'absent').length;
    const excusedCount = builders.filter(s => s.status === 'excused').length;
    const pendingCount = builders.filter(s => s.status === 'pending').length;
    const attendanceRate = totalBuilders > 0 ? Math.round((presentCount / totalBuilders) * 100) : 0;
    
    console.log('Statistics calculation:', { 
      totalBuilders, 
      presentCount, 
      absentCount, 
      excusedCount, 
      pendingCount,
      attendanceRate,
      currentDate: new Date().toISOString().split('T')[0],
      buildersSample: builders.slice(0, 2)
    });
    
    return {
      totalBuilders,
      presentCount,
      absentCount,
      excusedCount,
      pendingCount,
      attendanceRate
    };
  }, [builders]);

  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    
    // Ensure default start date is not before MINIMUM_DATE
    return date < MINIMUM_DATE 
      ? MINIMUM_DATE_STRING
      : date.toISOString().split('T')[0];
  };

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
      setIsHistoricalDialogOpen(false);
      
    } catch (error) {
      console.error('Error processing historical attendance:', error);
      toast.error('Failed to process historical attendance');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card p-4"
        >
          <span className="text-sm text-muted-foreground">Total</span>
          <div className="text-2xl font-bold mt-1">{stats.totalBuilders}</div>
          <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
            <div className="h-1 bg-primary rounded-full" style={{ width: '100%' }}></div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card p-4"
        >
          <span className="text-sm text-muted-foreground">Present</span>
          <div className="text-2xl font-bold mt-1 text-green-600">{stats.presentCount}</div>
          <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
            <div className="h-1 bg-green-500 rounded-full" style={{ width: `${stats.attendanceRate}%` }}></div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card p-4"
        >
          <span className="text-sm text-muted-foreground">Absent</span>
          <div className="text-2xl font-bold mt-1 text-red-600">{stats.absentCount}</div>
          <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
            <div className="h-1 bg-red-500 rounded-full" style={{ width: `${stats.totalBuilders > 0 ? (stats.absentCount / stats.totalBuilders * 100) : 0}%` }}></div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="glass-card p-4"
        >
          <span className="text-sm text-muted-foreground">Excused</span>
          <div className="text-2xl font-bold mt-1 text-amber-600">{stats.excusedCount}</div>
          <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
            <div className="h-1 bg-amber-500 rounded-full" style={{ width: `${stats.totalBuilders > 0 ? (stats.excusedCount / stats.totalBuilders * 100) : 0}%` }}></div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="glass-card p-4 relative"
        >
          <span className="text-sm text-muted-foreground">Pending</span>
          <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.pendingCount}</div>
          <div className="h-1 w-full bg-secondary/50 rounded-full mt-2">
            <div className="h-1 bg-yellow-500 rounded-full" style={{ width: `${stats.totalBuilders > 0 ? (stats.pendingCount / stats.totalBuilders * 100) : 0}%` }}></div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute top-1 right-1 px-2 py-1 h-auto text-xs flex items-center gap-1"
            onClick={() => {
              setStartDate(getDefaultStartDate());
              setEndDate(new Date().toISOString().split('T')[0]);
              setIsHistoricalDialogOpen(true);
            }}
          >
            <Calendar size={12} />
            Process History
          </Button>
        </motion.div>
      </div>

      <Dialog open={isHistoricalDialogOpen} onOpenChange={setIsHistoricalDialogOpen}>
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
              onClick={() => setIsHistoricalDialogOpen(false)}
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
    </>
  );
};

export default StatisticsCards;
