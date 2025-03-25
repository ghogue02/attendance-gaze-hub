
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileTextIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Builder } from './types';

interface BuilderNotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  builder: Builder;
  onNotesUpdated: (notes: string) => void;
}

const BuilderNotesDialog = ({ isOpen, onClose, builder, onNotesUpdated }: BuilderNotesDialogProps) => {
  const [notes, setNotes] = useState(builder.notes || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveNotes = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ notes: notes })
        .eq('id', builder.id);

      if (error) {
        console.error('Error updating builder notes:', error);
        toast.error('Failed to save notes');
        return;
      }
      
      onNotesUpdated(notes);
      toast.success('Notes saved successfully');
      onClose();
    } catch (error) {
      console.error('Error in handleSaveNotes:', error);
      toast.error('An error occurred while saving notes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Builder Notes: {builder.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this builder..."
            className="min-h-[200px]"
          />
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSaveNotes} disabled={isLoading}>
            Save Notes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuilderNotesDialog;
