
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadBuilderPhotos } from '@/utils/builders/extractBuilderPhotos';
import { toast } from 'sonner';

interface ExtractPhotosButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const ExtractPhotosButton = ({ 
  variant = 'secondary', 
  size = 'default',
  className = ''
}: ExtractPhotosButtonProps) => {
  const [isExtracting, setIsExtracting] = useState(false);
  
  const handleExtractPhotos = async () => {
    try {
      setIsExtracting(true);
      await downloadBuilderPhotos();
    } catch (error) {
      console.error('Error during photo extraction:', error);
      toast.error('Failed to extract builder photos');
    } finally {
      setIsExtracting(false);
    }
  };
  
  return (
    <Button
      onClick={handleExtractPhotos}
      variant={variant}
      size={size}
      className={className}
      disabled={isExtracting}
    >
      {isExtracting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Extracting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download Builder Photos
        </>
      )}
    </Button>
  );
};

export default ExtractPhotosButton;
