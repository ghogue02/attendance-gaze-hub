
import { Button } from "@/components/ui/button";
import { exportAttendanceHistory } from "@/utils/attendance/exportHistory";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ExportAttendanceButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const csvContent = await exportAttendanceHistory();
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', 'attendance_history.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Attendance history exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export attendance history');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Exporting...' : 'Export History'}
    </Button>
  );
}
