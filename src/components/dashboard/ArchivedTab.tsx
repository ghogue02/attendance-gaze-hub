
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCcw, UserX, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { recoverDeletedBuilders } from '@/utils/builders/recoverDeletedBuilders';
import { toast } from 'sonner';

interface ArchivedBuilder {
  id: string;
  name: string;
  lastAttendance: string;
  archivedAt: string;
  reason: string;
  isRecovered: boolean;
}

const ArchivedTab = () => {
  const [archivedBuilders, setArchivedBuilders] = useState<ArchivedBuilder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryCount, setRecoveryCount] = useState(0);

  const fetchArchivedBuilders = async () => {
    try {
      setIsLoading(true);
      
      // Fetch students - Get ALL builders where archived_at is not null
      const { data: builders, error: buildersError } = await supabase
        .from('students')
        .select('id, first_name, last_name, archived_at, archived_reason')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (buildersError) {
        console.error('Error fetching archived builders:', buildersError);
        toast.error('Failed to fetch archived builders');
        setArchivedBuilders([]);
        setIsLoading(false);
        return;
      }

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
        
        // Check if this is a recovered builder (based on reason containing "Recovered")
        const isRecovered = builder.archived_reason?.includes('Recovered') || false;

        return {
          id: builder.id,
          name: `${builder.first_name || ''} ${builder.last_name || ''}`.trim() || 'Unknown',
          lastAttendance: lastAttendanceDate,
          archivedAt: builder.archived_at ? new Date(builder.archived_at).toLocaleDateString() : 'Unknown',
          reason: builder.archived_reason || 'No reason provided',
          isRecovered
        };
      });

      const resolvedBuilders = await Promise.all(builderPromises);
      console.log('Processed archived builders:', resolvedBuilders.length);
      setArchivedBuilders(resolvedBuilders);
    } catch (error) {
      console.error('Error fetching archived builders:', error);
      toast.error('Failed to process archived builders');
      setArchivedBuilders([]);
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
      const recovered = await recoverDeletedBuilders();
      setRecoveryCount(recovered);
      
      // Refresh the list after recovery
      if (recovered > 0) {
        await fetchArchivedBuilders();
      }
    } catch (error) {
      console.error('Error during recovery process:', error);
      toast.error('Error during recovery process');
    } finally {
      setIsRecovering(false);
    }
  };

  // Stats for the recovered builders
  const recoveredCount = archivedBuilders.filter(b => b.isRecovered).length;

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
      
      {recoveredCount > 0 && (
        <div className="bg-muted/50 p-3 rounded-md flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <span>
            <strong>{recoveredCount}</strong> builders have been recovered from deleted records
          </span>
        </div>
      )}

      {archivedBuilders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {isLoading ? 'Loading archived builders...' : 'No archived builders found'}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Last Attendance</TableHead>
              <TableHead>Archived Date</TableHead>
              <TableHead className="w-1/3">Reason</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {archivedBuilders.map((builder) => (
              <TableRow key={builder.id} className={builder.isRecovered ? "bg-muted/30" : ""}>
                <TableCell>{builder.name}</TableCell>
                <TableCell>{builder.lastAttendance}</TableCell>
                <TableCell>{builder.archivedAt}</TableCell>
                <TableCell className="max-w-md truncate">{builder.reason}</TableCell>
                <TableCell>
                  {builder.isRecovered && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">
                      Recovered
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ArchivedTab;
