
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarX } from 'lucide-react';
import { CancelledDaysModal } from './CancelledDaysModal';

export function AdminButton() {
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        className="flex items-center gap-1"
        onClick={() => setModalOpen(true)}
      >
        <CalendarX className="h-4 w-4" />
        <span>Manage Cancelled Days</span>
      </Button>
      
      <CancelledDaysModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </>
  );
}
