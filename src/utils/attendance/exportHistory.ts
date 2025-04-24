
import { Builder } from '@/components/builder/types';
import { AttendanceRecord } from '@/components/dashboard/AttendanceTypes';
import { supabase } from '@/integrations/supabase/client';
import { isClassDay } from '@/utils/attendance/isClassDay';

interface BuilderAttendanceStats {
  builder: Builder;
  presentCount: number;
  absentCount: number;
  attendanceScore: number;
  attendanceByDate: Map<string, 'present' | 'absent'>;
}

export async function exportAttendanceHistory(): Promise<string> {
  try {
    // Fetch all builders
    const { data: builders, error: buildersError } = await supabase
      .from('students')
      .select('*')
      .is('archived_at', null)
      .order('last_name', { ascending: true });
      
    if (buildersError) throw buildersError;

    // Fetch all attendance records since March 15, 2025
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', '2025-03-15')
      .order('date', { ascending: true });
      
    if (attendanceError) throw attendanceError;

    // Filter records to only include class days
    const classDayRecords = attendanceRecords.filter(record => isClassDay(record.date));

    // Process data for each builder
    const builderStats = new Map<string, BuilderAttendanceStats>();
    const allDates = new Set<string>();

    // Initialize builder stats
    builders.forEach(builder => {
      builderStats.set(builder.id, {
        builder: {
          id: builder.id,
          name: `${builder.first_name} ${builder.last_name}`,
          builderId: builder.student_id || '',
          status: 'pending',
          image: builder.image_url
        },
        presentCount: 0,
        absentCount: 0,
        attendanceScore: 0,
        attendanceByDate: new Map()
      });
    });

    // Process attendance records
    classDayRecords.forEach(record => {
      const stats = builderStats.get(record.student_id);
      if (!stats) return;

      allDates.add(record.date);
      const status = record.status === 'present' ? 'present' : 'absent';
      stats.attendanceByDate.set(record.date, status);

      if (status === 'present') {
        stats.presentCount++;
      } else {
        stats.absentCount++;
      }
    });

    // Calculate attendance scores - FIX: Use presentCount / total for the calculation
    builderStats.forEach(stats => {
      const total = stats.presentCount + stats.absentCount;
      if (total === 0) {
        stats.attendanceScore = 0;
      } else {
        stats.attendanceScore = Math.round(
          (stats.presentCount / total) * 100
        );
      }
    });

    // Create CSV content
    const sortedDates = Array.from(allDates).sort();
    const headers = [
      'Builder',
      'Total Present',
      'Total Absent',
      'Attendance Score (%)',
      ...sortedDates
    ];

    const rows = Array.from(builderStats.values()).map(stats => {
      const baseData = [
        stats.builder.name,
        stats.presentCount.toString(),
        stats.absentCount.toString(),
        stats.attendanceScore.toString()
      ];

      // Add attendance status for each date
      const dateData = sortedDates.map(date => 
        stats.attendanceByDate.get(date) || 'N/A'
      );

      return [...baseData, ...dateData];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting attendance history:', error);
    throw error;
  }
}
