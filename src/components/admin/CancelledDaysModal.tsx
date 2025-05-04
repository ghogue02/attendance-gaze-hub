
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CANCELLED_CLASSES, isHoliday } from '@/utils/attendance/isClassDay';
import { CalendarX, Trash, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface CancelledDaysModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Schema for adding a new cancelled day
const formSchema = z.object({
  cancelDate: z.date({
    required_error: "Please select a date",
  }),
  reason: z.string().min(3, "Please provide a brief reason").max(100, "Reason must be less than 100 characters"),
});

export function CancelledDaysModal({ open, onOpenChange }: CancelledDaysModalProps) {
  const [cancelledDays, setCancelledDays] = useState<string[]>([...CANCELLED_CLASSES]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDayToDelete, setSelectedDayToDelete] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  // Load cancelled days and reasons from localStorage
  useEffect(() => {
    const storedReasons = localStorage.getItem('cancelledDayReasons');
    if (storedReasons) {
      setReasons(JSON.parse(storedReasons));
    }
  }, []);

  // Save modified cancelled days list to localStorage
  const saveCancelledDays = (days: string[], updatedReasons: Record<string, string>) => {
    // Save to localStorage for persistence
    localStorage.setItem('cancelledDays', JSON.stringify(days));
    localStorage.setItem('cancelledDayReasons', JSON.stringify(updatedReasons));
    
    // This would typically update your backend in a production app
    // For now, we'll just reload the page to update the CANCELLED_CLASSES set
    window.location.reload();
  };

  const handleAddCancelledDay = (values: z.infer<typeof formSchema>) => {
    const dateStr = values.cancelDate.toISOString().split('T')[0];
    
    // Check if the date is already in the permanent holidays
    if (isHoliday(dateStr)) {
      toast.error("This date is already marked as a permanent holiday");
      return;
    }
    
    // Check if it's already in the cancelled list
    if (cancelledDays.includes(dateStr)) {
      toast.error("This date is already in the cancelled list");
      return;
    }
    
    const newDays = [...cancelledDays, dateStr];
    const newReasons = {...reasons, [dateStr]: values.reason};
    
    setCancelledDays(newDays);
    setReasons(newReasons);
    saveCancelledDays(newDays, newReasons);
    
    toast.success(`Added ${dateStr} to cancelled class days`);
    form.reset();
  };

  const confirmDeleteDay = (day: string) => {
    setSelectedDayToDelete(day);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancelledDay = () => {
    if (!selectedDayToDelete) return;
    
    const newDays = cancelledDays.filter(day => day !== selectedDayToDelete);
    const newReasons = {...reasons};
    delete newReasons[selectedDayToDelete];
    
    setCancelledDays(newDays);
    setReasons(newReasons);
    saveCancelledDays(newDays, newReasons);
    
    toast.success(`Removed ${selectedDayToDelete} from cancelled class days`);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarX className="w-5 h-5" />
              Manage Cancelled Class Days
            </DialogTitle>
            <DialogDescription>
              Add or remove specific dates when classes are cancelled.
              These days will still show attendance data but will be marked as cancelled.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddCancelledDay)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cancelDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date to Cancel</FormLabel>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const dateStr = date.toISOString().split('T')[0];
                          return cancelledDays.includes(dateStr) || isHoliday(dateStr);
                        }}
                        className="rounded-md border"
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cancellation Reason</FormLabel>
                      <FormControl>
                        <Input placeholder="Weather, special event, etc." {...field} />
                      </FormControl>
                      <FormDescription>Brief reason why class is cancelled</FormDescription>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Add Cancelled Day
                </Button>
              </form>
            </Form>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Current Cancelled Days</h3>
              {cancelledDays.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cancelled class days configured</p>
              ) : (
                <div className="space-y-2">
                  {cancelledDays.sort().map((day) => (
                    <div 
                      key={day} 
                      className="flex items-center justify-between p-2 bg-secondary/30 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarX className="h-4 w-4 text-destructive" />
                        <span>{day}</span>
                        {reasons[day] && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Info className="h-3 w-3 inline mr-1" />
                            {reasons[day]}
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => confirmDeleteDay(day)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedDayToDelete} from the cancelled class days?
              This will mark it as a regular class day.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCancelledDay}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
