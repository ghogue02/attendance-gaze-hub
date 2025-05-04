
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { fetchCancelledDays, isHoliday } from '@/utils/attendance/isClassDay';
import { CalendarX, Trash, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';

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
  const [cancelledDays, setCancelledDays] = useState<{date: string, reason: string | null, id: string}[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDayToDelete, setSelectedDayToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  // Load cancelled days from Supabase when modal opens
  useEffect(() => {
    if (open) {
      loadCancelledDays();
    }
  }, [open]);

  const loadCancelledDays = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cancelled_days')
        .select('*')
        .order('date');
      
      if (error) {
        throw error;
      }
      
      setCancelledDays(data);
    } catch (err) {
      console.error('Error loading cancelled days:', err);
      toast.error('Failed to load cancelled class days');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCancelledDay = async (values: z.infer<typeof formSchema>) => {
    const dateStr = values.cancelDate.toISOString().split('T')[0];
    
    // Check if the date is already in the permanent holidays
    if (isHoliday(dateStr)) {
      toast.error("This date is already marked as a permanent holiday");
      return;
    }
    
    // Check if it's already in the cancelled list
    if (cancelledDays.some(day => day.date === dateStr)) {
      toast.error("This date is already in the cancelled list");
      return;
    }
    
    setSubmitLoading(true);
    try {
      const { data, error } = await supabase
        .from('cancelled_days')
        .insert({ 
          date: dateStr, 
          reason: values.reason 
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // Refresh cancelled days list
      await loadCancelledDays();
      // Also refresh the cache in the isClassDay utility
      fetchCancelledDays();
      
      toast.success(`Added ${dateStr} to cancelled class days`);
      form.reset();
    } catch (err) {
      console.error('Error adding cancelled day:', err);
      toast.error('Failed to add cancelled class day');
    } finally {
      setSubmitLoading(false);
    }
  };

  const confirmDeleteDay = (day: string) => {
    setSelectedDayToDelete(day);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancelledDay = async () => {
    if (!selectedDayToDelete) return;
    
    setDeleteLoading(true);
    try {
      const dayToDelete = cancelledDays.find(day => day.date === selectedDayToDelete);
      
      if (!dayToDelete) {
        toast.error('Day not found in the list');
        setDeleteDialogOpen(false);
        return;
      }
      
      const { error } = await supabase
        .from('cancelled_days')
        .delete()
        .eq('id', dayToDelete.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh cancelled days list
      await loadCancelledDays();
      // Also refresh the cache in the isClassDay utility
      fetchCancelledDays();
      
      toast.success(`Removed ${selectedDayToDelete} from cancelled class days`);
    } catch (err) {
      console.error('Error deleting cancelled day:', err);
      toast.error('Failed to remove cancelled class day');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
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
                          return cancelledDays.some(day => day.date === dateStr) || isHoliday(dateStr);
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

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Cancelled Day'
                  )}
                </Button>
              </form>
            </Form>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Current Cancelled Days</h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : cancelledDays.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cancelled class days configured</p>
              ) : (
                <div className="space-y-2">
                  {cancelledDays.map((day) => (
                    <div 
                      key={day.id} 
                      className="flex items-center justify-between p-2 bg-secondary/30 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarX className="h-4 w-4 text-destructive" />
                        <span>{day.date}</span>
                        {day.reason && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Info className="h-3 w-3 inline mr-1" />
                            {day.reason}
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => confirmDeleteDay(day.date)}
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
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); // Prevent default to handle loading state
                handleDeleteCancelledDay();
              }}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
