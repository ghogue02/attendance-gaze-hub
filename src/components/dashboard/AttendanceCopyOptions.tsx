
import { Copy, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AttendanceRecord } from './AttendanceTypes';
import { toast } from 'sonner';
import { convertToMarkdown, copyToClipboard } from './AttendanceTableUtils';

interface AttendanceCopyOptionsProps {
  attendanceRecords: AttendanceRecord[];
  formatDate: (date: string) => string;
  dateFilter: string | null;
}

const AttendanceCopyOptions = ({ 
  attendanceRecords,
  formatDate,
  dateFilter
}: AttendanceCopyOptionsProps) => {
  // Copy attendance records to clipboard
  const handleCopyToClipboard = async () => {
    // Format records with proper date format
    const formattedRecords = attendanceRecords.map(record => ({
      ...record,
      date: formatDate(record.date)
    }));
    
    const markdown = convertToMarkdown(formattedRecords);
    const success = await copyToClipboard(markdown);
    
    if (success) {
      toast.success('Attendance records copied to clipboard');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };
  
  // Download Markdown file
  const handleDownloadMarkdown = () => {
    // Format records with proper date format
    const formattedRecords = attendanceRecords.map(record => ({
      ...record,
      date: formatDate(record.date)
    }));
    
    const markdown = convertToMarkdown(formattedRecords);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `attendance-records${dateFilter ? '-' + dateFilter : ''}.md`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Markdown file downloaded');
  };

  if (attendanceRecords.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Copy Records</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyToClipboard}>
          <Clipboard className="mr-2 h-4 w-4" />
          <span>Copy to Clipboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadMarkdown}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Download as Markdown</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AttendanceCopyOptions;
