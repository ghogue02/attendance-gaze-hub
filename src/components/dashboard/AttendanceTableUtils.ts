
import { AttendanceRecord } from './AttendanceTypes';

/**
 * Converts attendance records to Markdown format
 */
export const convertToMarkdown = (records: AttendanceRecord[]): string => {
  if (records.length === 0) {
    return 'No attendance records found.';
  }

  // Create the markdown table header
  let markdown = '| Date | Name | Builder ID | Status | Time | Notes |\n';
  markdown += '| ---- | ---- | ---------- | ------ | ---- | ----- |\n';

  // Add each record as a row
  records.forEach(record => {
    const notes = record.excuseReason 
      ? `Excuse: ${record.excuseReason}${record.notes ? `\nNotes: ${record.notes}` : ''}`
      : record.notes || '';
    
    markdown += `| ${record.date} | ${record.studentName} | ${record.studentId} | ${record.status} | ${record.timeRecorded || '—'} | ${notes.replace(/\n/g, '<br>')} |\n`;
  });

  return markdown;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
