
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    const fetchArchivedBuilders = async () => {
      try {
        // Fetch archived builders
        const { data: builders, error: buildersError } = await supabase
          .from('students')
          .select('id, first_name, last_name, archived_at, archived_reason')
          .not('archived_at', 'is', null)
          .order('archived_at', { ascending: false });

        if (buildersError) throw buildersError;

        // Fetch last attendance dates for these builders
        const builderPromises = (builders || []).map(async (builder) => {
          const { data: attendance } = await supabase
            .from('attendance')
            .select('date')
            .eq('student_id', builder.id)
            .order('date', { ascending: false })
            .limit(1)
            .single();

          return {
            id: builder.id,
            name: `${builder.first_name} ${builder.last_name}`,
            lastAttendance: attendance?.date ? new Date(attendance.date).toLocaleDateString() : 'N/A',
            archivedAt: new Date(builder.archived_at).toLocaleDateString(),
            reason: builder.archived_reason || 'No reason provided'
          };
        });

        const resolvedBuilders = await Promise.all(builderPromises);
        setArchivedBuilders(resolvedBuilders);
      } catch (error) {
        console.error('Error fetching archived builders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArchivedBuilders();
  }, []);

  if (isLoading) {
    return <div className="text-center py-8">Loading archived builders...</div>;
  }

  if (archivedBuilders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No archived builders found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Archived Builders</h2>
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
    </div>
  );
};

export default ArchivedTab;
