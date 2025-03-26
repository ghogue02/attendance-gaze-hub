import { motion } from 'framer-motion';
import { UserCheck, UserX, Clock, CalendarIcon, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import UserProfileImage from './dashboard/UserProfileImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Skeleton } from './ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { BuilderStatus, Builder, AttendanceRecord } from './builder/types';

interface BuilderCardProps {
  builder: Builder;
  onVerify?: (builderId: string, status: BuilderStatus, reason?: string) => void;
  onDeleteRequest?: () => void;
}

const BuilderCard = ({ builder, onVerify, onDeleteRequest }: BuilderCardProps) => {
  const [isExcuseDialogOpen, setIsExcuseDialogOpen] = useState(false);
  const [excuseReason, setExcuseReason] = useState(builder.excuseReason || '');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getStatusColor = (status: BuilderStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'absent':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'excused':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'late':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: BuilderStatus) => {
    switch (status) {
      case 'present':
        return <UserCheck className="w-4 h-4" />;
      case 'absent':
      case 'excused':
        return <UserX className="w-4 h-4" />;
      case 'pending':
      case 'late':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleStatusChange = (status: BuilderStatus) => {
    if (status === 'excused') {
      setIsExcuseDialogOpen(true);
    } else if (onVerify) {
      onVerify(builder.id, status);
    }
  };

  const handleExcuseSubmit = () => {
    if (onVerify) {
      onVerify(builder.id, 'excused', excuseReason);
    }
    setIsExcuseDialogOpen(false);
  };

  const fetchAttendanceHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', builder.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching builder attendance history:', error);
        return;
      }

      const history: AttendanceRecord[] = data.map(record => {
        let status: BuilderStatus = record.status as BuilderStatus;
        if (record.excuse_reason && record.status === 'absent') {
          status = 'excused';
        }

        return {
          id: record.id,
          date: record.date,
          status,
          timeRecorded: record.time_recorded 
            ? new Date(record.time_recorded).toLocaleTimeString() 
            : undefined,
          excuseReason: record.excuse_reason
        };
      });

      setAttendanceHistory(history);
    } catch (error) {
      console.error('Error in fetchAttendanceHistory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    setIsHistoryDialogOpen(true);
    fetchAttendanceHistory();
  };

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return '';
      
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JS months are 0-based
      const day = parseInt(parts[2]);
      
      const date = new Date(year, month, day);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e, dateStr);
      return dateStr;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card p-5 transition-all duration-300 hover:shadow-glass-lg cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 shadow-sm border-2 border-white/20">
            <UserProfileImage
              userName={builder.name}
              userId={builder.id}
              className="w-full h-full"
            />
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-lg">{builder.name}</h3>
            <p className="text-sm text-foreground/70 mb-2">ID: {builder.builderId}</p>
            
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(builder.status)}`}>
              {getStatusIcon(builder.status)}
              <span className="ml-1 capitalize">{builder.status === 'excused' ? 'Excused Absence' : builder.status}</span>
            </div>
            
            {builder.timeRecorded && (
              <p className="text-xs text-foreground/60 mt-2">
                {builder.status === 'present' ? 'Recorded at: ' : 'Last check: '}
                {builder.timeRecorded}
              </p>
            )}
            
            {builder.excuseReason && builder.status === 'excused' && (
              <p className="text-xs italic text-foreground/60 mt-1">
                Reason: {builder.excuseReason}
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0" onClick={(e) => e.stopPropagation()}>
            {onVerify && (
              <>
                <Button
                  variant="outline" 
                  size="sm"
                  className={`${builder.status === 'present' ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
                  onClick={() => handleStatusChange('present')}
                >
                  Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`${builder.status === 'excused' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}
                  onClick={() => handleStatusChange('excused')}
                >
                  Excused
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`${builder.status === 'absent' ? 'bg-red-100 text-red-700 border-red-300' : ''}`}
                  onClick={() => handleStatusChange('absent')}
                >
                  Absent
                </Button>
              </>
            )}
            
            {onDeleteRequest && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRequest();
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <Dialog open={isExcuseDialogOpen} onOpenChange={setIsExcuseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Excuse Reason</DialogTitle>
          </DialogHeader>
          <Textarea
            value={excuseReason}
            onChange={(e) => setExcuseReason(e.target.value)}
            placeholder="Enter the reason for excused absence..."
            className="min-h-[120px]"
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsExcuseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExcuseSubmit}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Attendance History for {builder.name}
            </DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : attendanceHistory.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">No attendance records found for this builder.</p>
          ) : (
            <div className="overflow-y-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>
                        <span className={`font-medium capitalize ${getStatusColor(record.status).split(' ')[1]}`}>
                          {record.status === 'excused' ? 'Excused Absence' : record.status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[250px] break-words">
                        {record.excuseReason || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BuilderCard;
