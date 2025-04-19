
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCcw, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { recoverDeletedBuilders } from '@/utils/builders/recoverDeletedBuilders';

interface ArchivedBuilder {
  id: string;
  name: string;
  lastAttendance: string;
  archivedAt: string;
  reason: string;
}

const ArchivedTab = () => {
  const [archivedBuilders, setArchivedBuilders] = useState<ArchivedBuilder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);

  const fetchArchivedBuilders = async () => {
    try {
      setIsLoading(true);
      // Fetch archived builders - make sure to get ALL builders where archived_at is not null
      const { data: builders, error: buildersError } = await supabase
        .from('students')
        .select('id, first_name, last_name, archived_at, archived_reason')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (buildersError) throw buildersError;

      console.log('Archived builders found:', builders?.length || 0);
      
      if (!builders || builders.length === 0) {
        setArchivedBuilders([]);
        setIsLoading(false);
        return;
      }

      // Fetch last attendance dates for these builders
      const builderPromises = builders.map(async (builder) => {
        // Get the most recent attendance record for this builder
        const { data: attendance } = await supabase
          .from('attendance')
          .select('date')
          .eq('student_id', builder.id)
          .order('date', { ascending: false })
          .limit(1);

        const lastAttendanceDate = attendance && attendance[0]?.date 
          ? new Date(attendance[0].date).toLocaleDateString() 
          : 'N/A';

        return {
          id: builder.id,
          name: `${builder.first_name || ''} ${builder.last_name || ''}`.trim() || 'Unknown',
          lastAttendance: lastAttendanceDate,
          archivedAt: builder.archived_at ? new Date(builder.archived_at).toLocaleDateString() : 'Unknown',
          reason: builder.archived_reason || 'No reason provided'
        };
      });

      const resolvedBuilders = await Promise.all(builderPromises);
      console.log('Processed archived builders:', resolvedBuilders.length);
      setArchivedBuilders(resolvedBuilders);
    } catch (error) {
      console.error('Error fetching archived builders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedBuilders();
  }, []);

  const handleRecoverDeletedBuilders = async () => {
    setIsRecovering(true);
    try {
      await recoverDeletedBuilders();
      // Refresh the list after recovery
      await fetchArchivedBuilders();
    } finally {
      setIsRecovering(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading archived builders...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Archived Builders</h2>
        <div className="space-x-2">
          <Button 
            onClick={handleRecoverDeletedBuilders} 
            variant="outline"
            disabled={isRecovering}
            className="flex items-center gap-2"
          >
            <UserX className="h-4 w-4" />
            {isRecovering ? 'Recovering...' : 'Recover Deleted Builders'}
          </Button>
          <Button 
            onClick={fetchArchivedBuilders} 
            size="icon" 
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {archivedBuilders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No archived builders found
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Last Attendance</TableHead>
              <TableHead>Archived Date</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {archivedBuilders.map((builder) => (
              <TableRow key={builder.id}>
                <TableCell>{builder.name}</TableCell>
                <TableCell>{builder.lastAttendance}</TableCell>
                <TableCell>{builder.archivedAt}</TableCell>
                <TableCell className="max-w-md truncate">{builder.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ArchivedTab;
