
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ExtractPhotosButton from '@/components/builders/ExtractPhotosButton';

interface BuildersHeaderProps {
  onAddBuilderClick: () => void;
}

const BuildersHeader = ({ onAddBuilderClick }: BuildersHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Builders</h2>
      <div className="flex items-center gap-2">
        <ExtractPhotosButton variant="outline" />
        <Button 
          onClick={onAddBuilderClick}
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add Builder
        </Button>
      </div>
    </div>
  );
};

export default BuildersHeader;
